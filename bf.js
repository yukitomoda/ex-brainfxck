const Brainfuck = (function () {

  /**
   * Brainfuckコードからトークンを読み取るためのオブジェクト。
   * 
   * @class
   * @param {string} code Brainfuckコード
   */
  function TokenReader(code, tokenDefs) {
    this.code = code;
    this.cursor = 0;
    this.next = null;
    this.tokenDefs = tokenDefs || TokenReader.defaultTokenDefs;
  }

  TokenReader.defaultTokenDefs = [
    {
      matcher: /[a-zA-Z]/,
      factory: function (token) {
        const charCode = token.charCodeAt(0);
        const index = 0x61 <= charCode ? charCode - (0x61 - 26) : charCode - 0x41;
        return { type: 'charField', index: index, char: token };
      }
    },
    {
      matcher: '+',
      factory: function () {
        return { type: 'inc' };
      }
    },
    {
      matcher: '-',
      factory: function () {
        return { type: 'dec' };
      }
    },
    {
      matcher: '=',
      factory: function () {
        return { type: 'readCnt' };
      }
    },
    {
      matcher: '?',
      factory: function () {
        return { type: 'writeCnt' };
      }
    },
    {
      matcher: ',',
      factory: function () {
        return { type: 'readChar' };
      }
    },
    {
      matcher: '.',
      factory: function () {
        return { type: 'putChar' };
      }
    },
    {
      matcher: /[0-9]/,
      factory: function (token) {
        return { type: 'cnt', value: parseInt(token, 10) };
      }
    },
    {
      matcher: '[',
      factory: function () {
        return { type: 'loopStart' };
      }
    },
    {
      matcher: ']',
      factory: function () {
        return { type: 'loopEnd' };
      }
    },
    {
      matcher: '|',
      factory: function () {
        return { type: 'oneRegister' };
      }
    },
    {
      matcher: '_',
      factory: function () {
        return { type: 'zeroRegister' };
      }
    },
    {
      matcher: '#',
      factory: function () {
        return { type: 'arrayField' };
      }
    },
    {
      matcher: '*',
      factory: function () {
        return { type: 'arrayFieldPointer' };
      }
    },
    {
      matcher: '@',
      factory: function () {
        return { type: 'returnField' };
      }
    },
    {
      matcher: '$',
      factory: function () {
        return { type: 'returnFieldPointer' };
      }
    },
    {
      matcher: '&',
      factory: function () {
        return { type: 'cursorRegister' };
      }
    },
    {
      matcher: '>',
      factory: function () {
        return { type: 'incPtr' };
      }
    },
    {
      matcher: '<',
      factory: function () {
        return { type: 'decPtr' };
      }
    }
  ];

  TokenReader.prototype.tryGetNextToken = function () {
    while (true) {
      if (this.isEmpty()) return;
      let result = this.tryReadToken(this.code[this.cursor]);
      this.cursor++;
      if (result) return result;
    }
  };

  TokenReader.prototype.isEmpty = function () {
    return this.code.length <= this.cursor;
  };

  TokenReader.prototype.tryReadToken = function (char) {
    for (let i = 0; i < this.tokenDefs.length; i++) {
      const def = this.tokenDefs[i];
      if (def.matcher instanceof RegExp) {
        if (def.matcher.test(char)) return def.factory(char);
      } else {
        if (def.matcher == char) return def.factory(char);
      }
    }
  };

  /**
   * @class
   */
  function Register() {
    this._value = 0;
  }

  Register.prototype.getCurrentRegister = function () {
    return this;
  };

  Register.prototype.getValue = function () {
    return this._value;
  };

  Register.prototype.set = function (value) {
    this._value = value;
  };

  Register.prototype.add = function (value) {
    this._value += value;
  };

  /**
   * @class
   */
  function OneRegister() { }

  OneRegister.prototype.getCurrentRegister = function () {
    return this;
  };

  OneRegister.prototype.getValue = function () {
    return 1;
  };

  OneRegister.prototype.set = function (value) { };

  OneRegister.prototype.add = function (value) { };

  /**
   * @class
   */
  function ZeroRegister() { }

  ZeroRegister.prototype.getCurrentRegister = function () {
    return this;
  };

  ZeroRegister.prototype.getValue = function () {
    return 0;
  };

  ZeroRegister.prototype.set = function (value) { };

  ZeroRegister.prototype.add = function (value) { };

  /**
   * @class
   */
  function Field() {
    this.pointerRegister = new Register();
    this.registers = [];
  }

  Field.prototype.getCurrentRegister = function () {
    const ptr = this.pointerRegister.getValue();
    if (!this.registers[ptr]) this.registers[ptr] = new Register();
    return this.registers[ptr];
  };

  /**
   * @class
   */
  function Interpreter(code) {
    this.tokenReader = new TokenReader(code);
    this.commands = [];

    this.unresolvedLoopStartTokens = [];
    this.loopTokens = [];

    this.init();

    this._forwardTokenReader();
  }

  Interpreter.states = {
    Initialized: 'Initialized',
    InProgress: 'InProgress',
    WaitForInput: 'WaitForInput',
    Finished: 'Finished'
  };

  Interpreter.prototype._forwardTokenReader = function () {
    const next = this.tokenReader.tryGetNextToken();
    if (!next) return;

    switch (next.type) {
      case 'loopStart':
        next.commandIndex = this.commands.length;
        next.loopTokenIndex = this.loopTokens.length;
        this.unresolvedLoopStartTokens.push(next);
        this.loopTokens.push(next);
        break;
      case 'loopEnd':
        next.commandIndex = this.commands.length;
        next.loopTokenIndex = this.loopTokens.length;
        if (0 < this.unresolvedLoopStartTokens.length) {
          const start = this.unresolvedLoopStartTokens.pop();
          start.loopEndIndex = next.loopTokenIndex;
          next.loopStartIndex = start.loopTokenIndex;
        }
        this.loopTokens.push(next);
        break;
    }

    this.commands.push(next);
    return next;
  };

  Interpreter.prototype._tryGetNextCommand = function () {
    const cursor = this.cursorRegister.getValue();
    if (cursor < this.commands.length) {
      return this.commands[this.cursorRegister.getValue()];
    } else {
      if (this.tokenReader.isEmpty()) return;
      return this.tokenReader.tryGetNextToken();
    }
  };

  Interpreter.prototype._forwardCommand = function () {
    const command = this._tryGetNextCommand();
    if (command) {
      this.state = this._executeCurrentCommand(command);
    } else {
      this.state = Interpreter.states.Finished;
    }
    if (this.state == Interpreter.states.InProgress) this.cursorRegister.add(1);
    if (this.isFinished()) this.state = Interpreter.states.Finished;
  };

  Interpreter.prototype._executeCurrentCommand = function (command) {
    switch (command.type) {
      case 'charField':
        this.charField.pointerRegister.set(command.index);
        this.currentRegisterProvider = this.charField;
        return Interpreter.states.InProgress;
      case 'inc':
        this.currentRegister().add(this._popCurrentCounterValue());
        return Interpreter.states.InProgress;
      case 'dec':
        this.currentRegister().add(-this._popCurrentCounterValue());
        return Interpreter.states.InProgress;
      case 'cnt':
        if (this.counter == null) {
          this.counter = command.value;
        } else {
          this.counter = this.counter * 10 + command.value;
        }
        return Interpreter.states.InProgress;
      case 'readCnt':
        this.currentRegister().set(this._popCurrentCounterValue());
        return Interpreter.states.InProgress;
      case 'writeCnt':
        {
          const count = this._popCurrentCounterValue();
          this.counter = this.currentRegister().getValue() * count;
          return Interpreter.states.InProgress;
        }
      case 'readChar':
        if (this.input.length <= 0) return Interpreter.states.WaitForInput;
        this.currentRegister().set(this.input.shift());
        return Interpreter.states.InProgress;
      case 'putChar':
        this.output += String.fromCodePoint(this.currentRegister().getValue());
        return Interpreter.states.InProgress;
      case 'loopStart':
        {
          const value = this.currentRegister().getValue();
          const count = this._popCurrentCounterValue();
          if (count <= 0) Interpreter.states.InProgress;
          if (0 < value) {
            const returnCursor = this.cursorRegister.getValue();
            for (let i = 0; i < count; i++) {
              this.returnField.pointerRegister.add(1);
              this.returnField.getCurrentRegister().set(returnCursor);
            }
          } else {
            let loopEnd = this._findLoopEnd(command);
            if (!loopEnd) {
              this.cursorRegister.set(this.commands.length);
              return Interpreter.states.Finished;
            }
            for (var i = 1; i < count; i++) {
              // 一つ外側の]を探す
              while (true) {
                const nextLoopToken = this._findNextLoopToken(loopEnd);
                if (nextLoopToken.type == 'loopEnd') {
                  loopEnd = nextLoopToken;
                  break;
                }
                loopEnd = this._findLoopEnd(nextLoopToken);
                if (!loopEnd) {
                  this.cursorRegister.set(this.commands.length);
                  return Interpreter.states.Finished;
                }
              }
              this.returnField.pointerRegister.add(-1);
            }
            this.cursorRegister.set(loopEnd.commandIndex);
          }
        }
        return Interpreter.states.InProgress;
      case 'loopEnd':
        {
          const value = this.currentRegister().getValue();
          const count = this._popCurrentCounterValue();
          if (count <= 0) return Interpreter.states.InProgress;
          if (0 < value) {
            let nextPtr = this.returnField.pointerRegister.getValue() - count + 1;
            if (nextPtr <= 0) nextPtr = 0;
            this.returnField.pointerRegister.set(nextPtr);
            const destination = this.returnField.getCurrentRegister().getValue();
            this.cursorRegister.set(destination);
          } else {
            this.returnField.pointerRegister.add(-count);
          }
        }
        return Interpreter.states.InProgress;
      case 'incPtr':
        this.arrayField.pointerRegister.add(this._popCurrentCounterValue());
        return Interpreter.states.InProgress;
      case 'decPtr':
        this.arrayField.pointerRegister.add(-this._popCurrentCounterValue());
        return Interpreter.states.InProgress;
      case 'oneRegister':
        this.currentRegisterProvider = this.oneRegister;
        return Interpreter.states.InProgress;
      case 'zeroRegister':
        this.currentRegisterProvider = this.zeroRegister;
        return Interpreter.states.InProgress;
      case 'arrayField':
        this.currentRegisterProvider = this.arrayField;
        return Interpreter.states.InProgress;
      case 'arrayFieldPointer':
        this.currentRegisterProvider = this.arrayField.pointerRegister;
        return Interpreter.states.InProgress;
      case 'returnField':
        this.currentRegisterProvider = this.returnField;
        return Interpreter.states.InProgress;
      case 'returnFieldPointer':
        this.currentRegisterProvider = this.returnField.pointerRegister;
        return Interpreter.states.InProgress;
      case 'cursorRegister':
        this.currentRegisterProvider = this.cursorRegister;
        return Interpreter.states.InProgress;
      default:
        console.error('invalid command!' + command.type);
        return Interpreter.states.InProgress;
    }
  };

  Interpreter.prototype._popCurrentCounterValue = function () {
    const value = this.counter == null ? 1 : this.counter;
    this.counter = null;
    return value;
  };

  Interpreter.prototype._findLoopEnd = function (loopStart) {
    if (loopStart.loopEndIndex != null) {
      return this.loopTokens[loopStart.loopEndIndex];
    } else {
      let current = loopStart;
      while (true) {
        current = this._findNextLoopToken(current);
        if (!current) return;
        if (current.loopStartIndex == loopStart.loopTokenIndex) return current;
      }
    }
  };

  Interpreter.prototype._findNextLoopToken = function (currentLoopToken) {
    currentLoopToken = currentLoopToken || this.loopTokens[0];
    if (currentLoopToken) {
      const nextLoopTokenIndex = currentLoopToken.loopTokenIndex + 1;
      if (nextLoopTokenIndex < this.loopTokens.length) return this.loopTokens[nextLoopTokenIndex];
    }
    while (!this.tokenReader.isEmpty()) {
      const current = this._forwardTokenReader();
      if (current && current.type == 'loopStart' || current.type == 'loopEnd') return current;
    }
  };

  Interpreter.prototype.init = function () {
    this.counter = null;
    this.state = Interpreter.states.InProgress;

    this.cursorRegister = new Register();
    this.oneRegister = new OneRegister();
    this.zeroRegister = new ZeroRegister();
    this.arrayField = new Field();
    this.returnField = new Field();
    this.returnField.getCurrentRegister().set(-1);
    this.charField = new Field();
    this.currentRegisterProvider = this.arrayField;

    this.input = [];
    this.output = '';
  };

  Interpreter.prototype.isFinished = function () {
    return this.commands.length <= this.cursorRegister.getValue() && this.tokenReader.isEmpty();
  };

  Interpreter.prototype.currentRegister = function () {
    return this.currentRegisterProvider.getCurrentRegister();
  };

  Interpreter.prototype.step = function () {
    if (this.state !== Interpreter.states.Finished) {
      this._forwardCommand();
    }
  };

  Interpreter.prototype.run = function () {
    do {
      this.step();
    } while (this.state === Interpreter.states.InProgress)
  };

  Interpreter.prototype.parseToEnd = function () {
    while (!this.tokenReader.isEmpty()) this._forwardTokenReader();
  };

  return {
    Interpreter: Interpreter,
    TokenReader: TokenReader
  };
})();