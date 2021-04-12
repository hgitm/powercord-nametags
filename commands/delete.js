module.exports = {
  command: 'delete',
  description: 'Delete a nametag',
  executor: (args, main) => {
    if (!main.settings.get(args[0])) {
      return {
        send: false,
        result: {
          type: 'rich',
          title: `Nametag "${args[0]}" does not exist`
        }
      };
    }

    main.settings.delete(args[0]);

    return {
      send: false,
      result: {
        type: 'rich',
        color: 0x00FF00,
        title: `Successfully deleted nametag "${args[0]}".`
      }
    };
  },
  autocomplete: (args, settings) => {
    if (args[1] !== void 0) {
      return false;
    }

    return {
      header: 'Nametags available to delete',
      commands: settings
        .getKeys()
        .filter(tag => tag.toLowerCase().includes(args[0].toLowerCase()))
        .map(tag => ({
          command: tag,
          description: settings.get(tag)
        }))
    };
  }
};
