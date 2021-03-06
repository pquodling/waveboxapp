import PropTypes from 'prop-types'
import React from 'react'
import { mailboxStore } from 'stores/mailbox'
import { settingsStore } from 'stores/settings'
import { userStore } from 'stores/user'
import CoreMailbox from 'shared/Models/Accounts/CoreMailbox'
import CoreService from 'shared/Models/Accounts/CoreService'
import MailboxToolbar from './MailboxToolbar'
import GoogleMailboxMailWebView from './MailboxWebView/Google/GoogleMailboxMailWebView'
import GoogleMailboxServiceWebView from './MailboxWebView/Google/GoogleMailboxServiceWebView'
import GoogleMailboxCommunicationWebView from './MailboxWebView/Google/GoogleMailboxCommunicationWebView'
import GoogleMailboxContactsWebView from './MailboxWebView/Google/GoogleMailboxContactsWebView'
import GoogleMailboxStorageWebView from './MailboxWebView/Google/GoogleMailboxStorageWebView'
import TrelloMailboxWebView from './MailboxWebView/Trello/TrelloMailboxWebView'
import SlackMailboxWebView from './MailboxWebView/Slack/SlackMailboxWebView'
import GenericMailboxDefaultServiceWebView from './MailboxWebView/Generic/GenericMailboxDefaultServiceWebView'
import MicrosoftMailboxMailWebView from './MailboxWebView/Microsoft/MicrosoftMailboxMailWebView'
import MicrosoftMailboxServiceWebView from './MailboxWebView/Microsoft/MicrosoftMailboxServiceWebView'
import MicrosoftMailboxStorageWebView from './MailboxWebView/Microsoft/MicrosoftMailboxStorageWebView'
import MailboxWebViewHibernator from './MailboxWebView/MailboxWebViewHibernator'

const TOOLBAR_HEIGHT = 40
const styles = {
  mailboxTab: {
    position: 'absolute',
    top: 10000,
    bottom: -10000,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%'
  },
  mailboxTabActive: {
    top: 0,
    bottom: 0
  },
  serviceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  serviceContainerWithToolbar: {
    position: 'absolute',
    top: TOOLBAR_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0
  },
  appDragbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
    zIndex: 100,
    WebkitAppRegion: 'drag'
  }
}

export default class MailboxTab extends React.Component {
  /* **************************************************************************/
  // Class
  /* **************************************************************************/

  static propTypes = {
    mailboxId: PropTypes.string.isRequired
  }

  /* **************************************************************************/
  // Component Lifecycle
  /* **************************************************************************/

  componentDidMount () {
    mailboxStore.listen(this.mailboxUpdated)
    userStore.listen(this.userUpdated)
  }

  componentWillUnmount () {
    mailboxStore.unlisten(this.mailboxUpdated)
    userStore.unlisten(this.userUpdated)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.mailboxId !== nextProps.mailboxId) {
      this.setState(this.generateState(nextProps))
    }
  }

  /* **************************************************************************/
  // Data lifecycle
  /* **************************************************************************/

  state = this.generateState(this.props)

  /**
  * Generates the state from the given props
  * @param props: the props to use
  * @return state object
  */
  generateState (props) {
    const settingsState = settingsStore.getState()
    const mailboxState = mailboxStore.getState()
    const userState = userStore.getState()
    const mailbox = mailboxState.getMailbox(props.mailboxId)
    return {
      isMailboxActive: mailboxState.activeMailboxId() === props.mailboxId,
      appHasTitlebar: settingsState.ui.showTitlebar, // Purposely don't update this because changes aren't reflected until restart
      userHasServices: userState.user.hasServices,
      serviceDisplayMode: mailbox.serviceDisplayMode,
      serviceTypes: mailbox.enabledServiceTypes,
      mailboxType: mailbox.type
    }
  }

  mailboxUpdated = (mailboxState) => {
    const mailbox = mailboxState.getMailbox(this.props.mailboxId)
    if (!mailbox) { return }
    this.setState({
      isMailboxActive: mailboxState.activeMailboxId() === this.props.mailboxId,
      serviceDisplayMode: mailbox.serviceDisplayMode,
      serviceTypes: mailbox.enabledServiceTypes,
      mailboxType: mailbox.type
    })
  }

  userUpdated = (userState) => {
    this.setState({
      userHasServices: userState.user.hasServices
    })
  }

  /* **************************************************************************/
  // Rendering
  /* **************************************************************************/

  shouldComponentUpdate (nextProps, nextState) {
    if (this.state.isMailboxActive !== nextState.isMailboxActive) { return true }
    if (this.props.mailboxId !== nextProps.mailboxId) { return true }
    if (this.state.mailboxType !== nextState.mailboxType) { return true }
    if (this.state.serviceDisplayMode !== nextState.serviceDisplayMode) { return true }
    if (this.state.appHasTitlebar !== nextState.appHasTitlebar) { return true }
    if (JSON.stringify(this.state.serviceTypes) !== JSON.stringify(nextState.serviceTypes)) { return true }
    if (this.state.userHasServices !== nextState.userHasServices) { return true }

    return false
  }

  /**
  * Renders an individual tab
  * @param key: the element key
  * @param mailboxType: the type of mailbox
  * @param mailboxId: the id of the mailbox
  * @param serviceType: the service of the tab
  * @return jsx
  */
  renderWebView (key, mailboxType, mailboxId, serviceType) {
    if (mailboxType === CoreMailbox.MAILBOX_TYPES.GOOGLE) {
      switch (serviceType) {
        case CoreService.SERVICE_TYPES.DEFAULT:
          return (<GoogleMailboxMailWebView mailboxId={mailboxId} key={key} />)
        case CoreService.SERVICE_TYPES.COMMUNICATION:
          return (<GoogleMailboxCommunicationWebView mailboxId={mailboxId} key={key} />)
        case CoreService.SERVICE_TYPES.STORAGE:
          return (<GoogleMailboxStorageWebView mailboxId={mailboxId} key={key} />)
        case CoreService.SERVICE_TYPES.CONTACTS:
          return (<GoogleMailboxContactsWebView mailboxId={mailboxId} key={key} />)
        default:
          return (<GoogleMailboxServiceWebView mailboxId={mailboxId} serviceType={serviceType} key={key} />)
      }
    } else if (mailboxType === CoreMailbox.MAILBOX_TYPES.TRELLO) {
      return (<TrelloMailboxWebView mailboxId={mailboxId} key={key} />)
    } else if (mailboxType === CoreMailbox.MAILBOX_TYPES.SLACK) {
      return (<SlackMailboxWebView mailboxId={mailboxId} key={key} />)
    } else if (mailboxType === CoreMailbox.MAILBOX_TYPES.MICROSOFT) {
      switch (serviceType) {
        case CoreService.SERVICE_TYPES.DEFAULT:
          return (<MicrosoftMailboxMailWebView mailboxId={mailboxId} key={key} />)
        case CoreService.SERVICE_TYPES.STORAGE:
          return (<MicrosoftMailboxStorageWebView mailboxId={mailboxId} key={key} />)
        default:
          return (<MicrosoftMailboxServiceWebView mailboxId={mailboxId} serviceType={serviceType} key={key} />)
      }
    } else if (mailboxType === CoreMailbox.MAILBOX_TYPES.GENERIC) {
      return (<GenericMailboxDefaultServiceWebView mailboxId={mailboxId} key={key} />)
    } else {
      return (<MailboxWebViewHibernator mailboxId={mailboxId} serviceType={serviceType} key={key} />)
    }
  }

  render () {
    const { style, mailboxId, ...passProps } = this.props
    const {
      mailboxType,
      appHasTitlebar,
      serviceTypes,
      serviceDisplayMode,
      isMailboxActive,
      userHasServices
    } = this.state

    const saltedStyle = Object.assign({},
      styles.mailboxTab,
      isMailboxActive ? styles.mailboxTabActive : {},
      style
    )

    const allowedServiceTypes = userHasServices ? serviceTypes : [CoreMailbox.SERVICE_TYPES.DEFAULT]
    const hasToolbar = allowedServiceTypes.length > 1 && serviceDisplayMode === CoreMailbox.SERVICE_DISPLAY_MODES.TOOLBAR

    return (
      <div {...passProps} style={saltedStyle}>
        {hasToolbar ? (
          <MailboxToolbar mailboxId={mailboxId} toolbarHeight={TOOLBAR_HEIGHT} />
        ) : undefined}
        {!hasToolbar && !appHasTitlebar ? (
          <div style={styles.appDragbar} />
        ) : undefined}
        <div style={hasToolbar ? styles.serviceContainerWithToolbar : styles.serviceContainer}>
          {allowedServiceTypes.map((serviceType) => {
            return this.renderWebView(serviceType, mailboxType, mailboxId, serviceType)
          })}
        </div>
      </div>
    )
  }
}
