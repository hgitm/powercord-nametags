const getPrefix = () => powercord.api.commands.prefix;

module.exports = {
  command: 'add',
  description: 'Create a nametag',
  executor: (args, main) => {
    if (args.length < 2) {
      return {
        send: false,
        result: {
          type: 'rich',
          title: 'Missing required arguments',
          footer: { text: `Refer to ${getPrefix()}help tag` }
        }
      };
    }

    const name = args.shift().toLowerCase();
    const value = args.join(' ').replace(/\\n/g, '\n');

    if (powercord.api.commands.find(c => c.command === name)) {
      return {
        send: false,
        result: {
          type: 'rich',
          title: `Command "${name}" is already registered - enter a different name`
        }
      };
    }

    if (main.settings.get(name)) {
      return {
        send: false,
        result: {
          type: 'rich',
          title: `Tag "${name}" already exists (use ${getPrefix()}tag update)`
        }
      };
    }

    main.settings.set(name, value);

    return {
      send: false,
      result: {
        type: 'rich',
        title: 'Successfully created nametag',
        color: 0x00FF00,
        fields: [ {
          name: 'Name',
          value: name,
          inline: false
        }, {
          name: 'Value',
          value,
          inline: false
        } ]
      }
    };
  },
  autocomplete: (args) => {
    if (args[1] === void 0) {
      return {
        commands: [ {
          command: 'Enter a nametag name...',
          instruction: true
        } ]
      };
    }

    if (args[2] === void 0) {
      return {
        commands: [ {
          command: `Enter the content of "${args[0]}"...`,
          wildcard: true,
          instruction: true
        } ]
      };
    }
  }
};
