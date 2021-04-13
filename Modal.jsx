const {
  React,
  i18n: { Messages },
  getModule,
  getModuleByDisplayName,
  constants: { ROLE_COLORS }
} = require("powercord/webpack");
const {
  AsyncComponent,
  Button,
  settings: { TextInput }
} = require("powercord/components");

let FormTitle;
let FormItem;
let ModalRoot;
let Header;
let Content;
let Footer;
let marginBottom20;

class EditNicknameModal extends React.Component {
  constructor(props) {
      super(props);

      this.state = {
          nickname: props.changed.nickname || "",
      };
  }

  render() {
      return (
          <ModalRoot transitionState={1}>
              <Header separator={false}>
                  <FormTitle tag={FormTitle.Tags.H4}>
                      Nametag
                  </FormTitle>
              </Header>
              <Content>
                  <TextInput
                      onChange={_ => this.setNickname(_)}
                      placeholder={this.props.username}
                      value={this.state.nickname}
                      onKeyDown={e => {if (e.key === 'Enter') this.props.close(this.state); if (e.key === 'Escape') this.props.close(null);}}
                      autoFocus={true}
                  />
              </Content>
              <Footer>
                  <Button
                      type="submit"
                      onClick={() => this.props.close(this.state)}
                  >
                      {Messages.DONE}
                  </Button>
                  <Button
                      onClick={() => this.props.close(null)}
                      look={Button.Looks.LINK}
                      color={Button.Colors.PRIMARY}
                  >
                      {Messages.CANCEL}
                  </Button>
              </Footer>
          </ModalRoot>
      );
  }

  setNickname(nickname) {
      this.setState(prevState =>
          Object.assign(prevState, {
              nickname: nickname
          })
      );
  }
}

module.exports = AsyncComponent.from(
  new Promise(async resolve => {
      const FormModule = await getModule(["FormTitle"]);
      FormTitle = FormModule.FormTitle;
      FormItem = FormModule.FormItem;
      const ModalModule = await getModule(["ModalRoot"]);
      ModalRoot = ModalModule.ModalRoot;
      Header = ModalModule.ModalHeader;
      Content = ModalModule.ModalContent;
      Footer = ModalModule.ModalFooter;
      marginBottom20 = (await getModule(["marginBottom20"])).marginBottom20;

      resolve(EditNicknameModal);
  })
);