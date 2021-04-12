module.exports = {
  command: 'list',
  description: 'Get a list of all nametags you have',
  executor: (_, { settings }) => {
    const keys = settings.getKeys();
    return {
      send: false,
      result: {
        type: 'rich',
        title: `You have ${keys.length} ${keys.length === 1 ? 'nametag' : 'nametags'} available:`,
        description: keys.map(key => `- ${key}`).join('\n')
      }
    };
  }
};
