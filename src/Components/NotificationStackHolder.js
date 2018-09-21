import React, { Component } from 'react';
import NotificationStack from './NotificationStack';

class NotificationStackHolder extends Component {
  render() {
    return (
      <div className="main-notification-holder">{this.props.children}</div>
    );
  }
}

export default NotificationStackHolder;
