import React, { Component } from 'react';
import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import moment from 'moment'
import { rootAddress } from '../constants/api'

class PastePanel extends Component {
  getPastes = () => {
    let pastes = [];
    for (let key in localStorage) {
      if (key.indexOf('blockpaste') !== -1) {
        const { link, createdAt } = JSON.parse(localStorage.getItem(key))
        pastes.push(
          <div className="paste-list-item" key={key}>
            <div className="paste-list-description">
              <span><strong>Created {moment(createdAt).fromNow()}</strong></span>
            </div>
            <DefaultButton
              primary
              text='View'
              onClick={() => window.location.replace(`${rootAddress}/${link}`)}
            />
            <DefaultButton
              className="delete-button"
              text='Remove'
              onClick={() => this.deletePaste(key)}
            />
          </div>
        )
      }
    }
    return pastes
  }

  deletePaste(key) {
    localStorage.removeItem(key)
    this.forceUpdate()
  }

  render() {
    return (
      <Panel
        isOpen={this.props.isOpen}
        isLightDismiss
        type={PanelType.smallFixedFar}
        onDismiss={this.props.onDismiss}
        headerText='Previous Pastes'
        closeButtonAriaLabel='Close'>
        {this.getPastes()}
      </Panel>
    )
  }
}

export default PastePanel;