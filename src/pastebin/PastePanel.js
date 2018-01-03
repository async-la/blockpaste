import React, { Component } from 'react';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';


class PastePanel extends Component {
  getPastes = () => {
    let pastes = [];
    for (let key in localStorage) {
      if (key.indexOf('blockpaste') !== -1) {
        const link = localStorage.getItem(key)
        const date = key.split(':')[2]
        pastes.push(
          <div key={key}>
            <a href={link}>{new Date(parseInt(date)).toString()}</a>
            <button onClick={() => this.deletePaste(key)}>Delete</button>
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
        type={ PanelType.smallFixedFar }
        onDismiss={this.props.onDismiss}
        headerText='Previous Pastes'
        closeButtonAriaLabel='Close'>
        {this.getPastes()}
      </Panel>
    )
  }
}

export default PastePanel;
