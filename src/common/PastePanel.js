import React, { Component } from 'react'
import { DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { Label } from 'office-ui-fabric-react/lib/Label'
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import config from '../config'
import moment from 'moment'

import {
  APP_SWARM_BIN,
  PASTE_SWARM_BIN,
  PASTE_PLAYGROUND,
} from '../constants/app'
import './PastePanel.css'

class PastePanel extends Component {
  getPastes = () => {
    const platfrom =
      this.props.platform === APP_SWARM_BIN ? PASTE_SWARM_BIN : PASTE_PLAYGROUND
    let pastes = []
    for (let key in localStorage) {
      if (key.indexOf(platfrom) !== -1) {
        const { link, createdAt } = JSON.parse(localStorage.getItem(key))
        pastes.push(
          <div className="paste-list-item" key={key}>
            <div className="paste-list-description">
              <span>
                <strong>Created {moment(createdAt).fromNow()}</strong>
              </span>
            </div>
            <DefaultButton
              primary
              text="View"
              onClick={() =>
                window.location.replace(`${config.rootAddress}/${link}`)
              }
            />
            <DefaultButton
              className="delete-button"
              text="Remove"
              onClick={() => this.deletePaste(key)}
            />
          </div>
        )
      }
    }
    return pastes.reverse()
  }

  deletePaste(key) {
    localStorage.removeItem(key)
    this.forceUpdate()
  }

  render() {
    return (
      <Panel
        isBlocking={false}
        isOpen={this.props.isOpen}
        isLightDismiss
        type={PanelType.smallFixedFar}
        onDismiss={this.props.onDismiss}
        headerText={<Label style={{ fontSize: 30 }}>Saved Pastes</Label>}
        closeButtonAriaLabel="Close"
      >
        <Toggle
          checked={this.props.persistOn}
          label="Enable paste history"
          onText="On"
          offText="Off"
          onChanged={this.props.onPersistChanged}
        />
        {this.getPastes()}
      </Panel>
    )
  }
}

export default PastePanel
