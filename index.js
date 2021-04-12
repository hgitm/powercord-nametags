const { Plugin } = require('powercord/entities');
const { getModule, getModuleByDisplayName, i18n: { Messages }, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { getOwnerInstance, findInReactTree } = require('powercord/util');
const commands = require('./commands');

const TAG_ARGUMENT_REGEX = /\$\$(@|\d+)/g;

module.exports = class NameTags extends Plugin {
  async startPlugin () {
    this.registerMain();

    const messageHeader = getModule([ 'MessageTimestamp' ], false) || getModule(m => (
			typeof (m?.__powercordOriginal_default || m.default) === 'function' &&
			(m?.__powercordOriginal_default || m.default).toString().includes('headerText')
		  ), false);
    console.log(messageHeader)

    inject(
      "nametag-messageHeaderPatch",
      messageHeader,
      "default",
      (args,res) => this.messageHeaderPatch(args,res)
    );
  }

  pluginWillUnload () {
    powercord.api.commands.unregisterCommand('tag');
  }

  messageHeaderPatch(args, res) {
    const message = args[0].message;
    
    const nametag = this.settings.get(message.author.id,null)
    if (nametag != null) {
      const header = findInReactTree(res, e => Array.isArray(e?.props?.children) && e.props.children.find(c => c?.props?.message));
      header.props.children.splice(1,0,React.createElement(
        'span',
        {style:{marginLeft: "5px"},className:"nametag-header"},
        `[${nametag}]`)
      );
    }

    return res;
  }

  registerMain () {
    powercord.api.commands.registerCommand({
      command: 'nametag',
      description: 'Send, preview and manage your nametags',
      usage: '{c} <view|list|add|update|delete> <nametagUserId> [nametagContent]',
      executor: (args) => {
        const subcommand = commands[args[0]];
        if (!subcommand) {
          return {
            send: false,
            result: `\`${args[0]}\` is not a valid subcommand. Specify one of ${Object.keys(commands).map(cmd => `\`${cmd}\``).join(', ')}.`
          };
        }

        return subcommand.executor(args.slice(1), this);
      },
      autocomplete: (args) => {
        if (args[0] !== void 0 && args.length === 1) {
          return {
            commands: Object.values(commands).filter(({ command }) => command.includes(args[0].toLowerCase())),
            header: 'tag subcommands'
          };
        }

        const subcommand = commands[args[0]];
        if (!subcommand || !subcommand.autocomplete) {
          return false;
        }

        return subcommand.autocomplete(args.slice(1), this.settings);
      }
    });
  }
};
