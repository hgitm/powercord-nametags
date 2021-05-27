const { Plugin } = require("powercord/entities");
const {
  getModule,
  getModuleByDisplayName,
  i18n: { Messages },
  React,
} = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");
const { getOwnerInstance, findInReactTree } = require("powercord/util");
const commands = require("./commands");
const {
  Menu: { MenuGroup, MenuItem },
} = require("powercord/components");
const EditModal = require("./Modal");

const TAG_ARGUMENT_REGEX = /\$\$(@|\d+)/g;

module.exports = class NameTags extends Plugin {
  async startPlugin() {
    this.registerMain();

    const messageHeader =
      getModule(["MessageTimestamp"], false) ||
      getModule(
        (m) =>
          typeof (m?.__powercordOriginal_default || m.default) === "function" &&
          (m?.__powercordOriginal_default || m.default)
            .toString()
            .includes("showTimestampOnHover"),
        false
      );
    const memberListItem = await getModuleByDisplayName("MemberListItem");
    const discordTag = await getModule(
      (m) => m.default?.displayName === "DiscordTag"
    );
    const voiceUser = await getModuleByDisplayName("VoiceUser");
    const dmUserContextMenu = await getModule(
      (m) => m.default?.displayName === "DMUserContextMenu"
    );
    const groupDmUserContextMenu = await getModule(
      (m) => m.default?.displayName === "GroupDMUserContextMenu"
    );
    const guildUserContextMenu = await getModule(
      (m) => m.default?.displayName === "GuildChannelUserContextMenu"
    );
    this.modalStack = await getModule(["push", "popWithKey"]);

    inject(
      "nametag-messageHeaderPatch",
      messageHeader,
      "default",
      (args, res) => this.messageHeaderPatch(args, res)
    );

    inject(
      "nametag-memberListItemPatch",
      memberListItem.prototype,
      "render",
      this.memberListItemPatch(this)
    );

    inject("nametag-discordTagPatch", discordTag, "default", (args, res) =>
      this.discordTagPatch(args, res)
    );

    inject(
      "nametag-voiceUserPatch",
      voiceUser.prototype,
      "renderName",
      this.voiceUserPatch(this)
    );
    inject(
      "nametag-dmContextPatch",
      dmUserContextMenu,
      "default",
      this.contextPatch(this)
    );
    inject(
      "nametag-groupDmContextPatch",
      groupDmUserContextMenu,
      "default",
      this.contextPatch(this)
    );
    inject(
      "nametag-guildUserContextPatch",
      guildUserContextMenu,
      "default",
      this.contextPatch(this)
    );

    dmUserContextMenu.default.displayName = "DMUserContextMenu";
    groupDmUserContextMenu.default.displayName = "GroupDMUserContextMenu";
    guildUserContextMenu.default.displayName = "GuildChannelUserContextMenu";
    discordTag.default.displayName = "DiscordTag";
  }

  pluginWillUnload() {
    powercord.api.commands.unregisterCommand("nametag");
    uninject("nametag-messageHeaderPatch");
    uninject("nametag-memberListItemPatch");
    uninject("nametag-discordTagPatch");
    uninject("nametag-voiceUserPatch");
    uninject("nametag-dmContextPatch");
    uninject("nametag-groupDmContextPatch");
    uninject("nametag-guildUserContextPatch");
  }

  messageHeaderPatch(args, res) {
    const message = args[0].message;

    const nametag = this.settings.get(message.author.id, null);
    if (nametag != null) {
      const header = findInReactTree(
        res,
        (e) =>
          Array.isArray(e?.props?.children) &&
          e.props.children.find((c) => c?.props?.message)
      );

      const rolecolorSetting = ["t", "1", "true", "y", "yes"].includes(
        this.settings.get("_rolecolor", "false")
      )
        ? true
        : false;
      const color = header.props.children[0].props.author.colorString;
      const should_color = rolecolorSetting && color != undefined;

      header.props.children.splice(
        1,
        0,
        React.createElement(
          "span",
          {
            style: should_color
              ? { marginLeft: "5px", color: color }
              : { marginLeft: "5px" },
            className: "nametag-header",
          },
          `[${nametag}]`
        )
      );
    }

    return res;
  }

  memberListItemPatch(main) {
    return function (args, res) {
      if (!this.props.user) return res;
      const nametag = main.settings.get(this.props.user.id, null);
      if (nametag != null) {
        res.props.name.props.children = React.createElement(
          "span",
          null,
          this.props.nick || this.props.user.username,
          React.createElement(
            "span",
            { style: { marginLeft: "5px" }, className: "nametag-memberlist" },
            `[${nametag}]`
          )
        );
      }
      return res;
    };
  }

  discordTagPatch(args, res) {
    const user = args[0].user;
    const nametag = this.settings.get(user.id, null);

    if (nametag != null) {
      res.props.discriminator = React.createElement(
        "span",
        null,
        user.discriminator,
        React.createElement(
          "span",
          { style: { marginLeft: "5px" }, className: "nametag-discordtag" },
          `[${nametag}]`
        )
      );
    }
    return res;
  }

  voiceUserPatch(main) {
    return function (args, res) {
      if (!res) return res;

      const nametag = main.settings.get(this.props.user.id, null);

      if (nametag != null) {
        res.props.children = React.createElement(
          "span",
          null,
          this.props.nick || this.props.user.username,
          React.createElement(
            "span",
            { style: { marginLeft: "5px" }, className: "nametag-voiceuser" },
            `[${nametag}]`
          )
        );
      }

      return res;
    };
  }

  contextPatch(_this) {
    return function (args, res) {
      const user = args[0].user;
      const nametag = _this.settings.get(user.id, {});

      const customGroup = React.createElement(MenuGroup, null, [
        React.createElement(MenuItem, {
          id: "nametag-edit",
          label: "Edit Nametag",
          action: () => {
            _this.modalStack.push(
              EditModal,
              {
                username: _this.settings.get(user.id, user.username),
                changed: nametag,
                close: (state) => {
                  if (state != null) {
                    if (state == {} || state.nickname == "")
                      _this.settings.delete(user.id);
                    else _this.settings.set(user.id, state.nickname);
                  }
                  _this.modalStack.popWithKey("nametag-modal");
                },
              },
              "nametag-modal"
            );
          },
        }),
      ]);

      const groups = res.props.children.props.children;

      const devGroup = groups.find(
        (c) =>
          c &&
          c.props &&
          c.props.children &&
          c.props.children.props &&
          c.props.children.props.id === "devmode-copy-id"
      );

      if (devGroup) {
        groups.splice(groups.indexOf(devGroup), 0, customGroup);
      } else {
        groups.push(customGroup);
      }

      return res;
    };
  }

  registerMain() {
    powercord.api.commands.registerCommand({
      command: "nametag",
      description: "Send, preview and manage your nametags",
      usage:
        "{c} <view|list|add|update|delete> <nametagUserId> [nametagContent]",
      executor: (args) => {
        const subcommand = commands[args[0]];
        if (!subcommand) {
          return {
            send: false,
            result: `\`${
              args[0]
            }\` is not a valid subcommand. Specify one of ${Object.keys(
              commands
            )
              .map((cmd) => `\`${cmd}\``)
              .join(", ")}.`,
          };
        }

        return subcommand.executor(args.slice(1), this);
      },
      autocomplete: (args) => {
        if (args[0] !== void 0 && args.length === 1) {
          return {
            commands: Object.values(commands).filter(({ command }) =>
              command.includes(args[0].toLowerCase())
            ),
            header: "tag subcommands",
          };
        }

        const subcommand = commands[args[0]];
        if (!subcommand || !subcommand.autocomplete) {
          return false;
        }

        return subcommand.autocomplete(args.slice(1), this.settings);
      },
    });
  }
};
