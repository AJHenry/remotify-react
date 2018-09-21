import React, { Component } from 'react';
import {
  Container,
  Row,
  Col,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import GoogleButton from 'react-google-button';
import BrowserNotification from 'react-web-notification';
import NotificationStack from './Components/NotificationStack';
import NotificationStackHolder from './Components/NotificationStackHolder';
import Notification from './Components/Notification';
import Header from './Components/Header';
import './css/App.css';
import firebase, { auth, provider } from './firebase/firebase';

class App extends Component {
  constructor() {
    super();
    this.state = {
      notificationStackList: [],
      notificationStackObject: {},
      username: '',
      user: null,
      displayName: '',
      email: '',
      uid: '',
      title: '',
      options: null,
      finishedInitialLoad: false,
    };

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.removeNotification = this.removeNotification.bind(this);
  }

  /**
   * Function for signing out
   */
  logout() {
    auth.signOut().then(() => {
      this.setState({
        user: null,
      });
    });
  }

  /**
   * Function for signing in
   */
  login() {
    auth.signInWithPopup(provider).then(result => {
      const user = result.user;
      this.setState({
        user: user,
      });
    });
  }

  checkNotificationPermission() {
    return Notification.permission !== 'granted';
  }

  componentDidMount() {
    auth.onAuthStateChanged(user => {
      if (user) {
        this.setState({
          user: user,
          displayName: user.displayName,
          email: user.email,
          uid: user.uid,
          ignore: true,
        });

        //Establish connection for the app
        this.establishConnection(this.state.uid);

        const db = firebase.database();
        const uid = this.state.uid;
        const referenceString = 'notification';

        const notificationRef = db.ref(referenceString).child(uid);

        notificationRef.on('child_added', snapshot => {
          let notificationList = snapshot.val();
          let packageName = snapshot.key;
          //console.log(notificationList);
          //console.log(packageName);
          this.preparePackageBlock(packageName, notificationList);
        });
      }
    });
  }

  /**
   * Adds listeners for each application
   * @param {Name of the package of the notification, used as a key} packageName
   * @param {*} notificationList
   */
  preparePackageBlock(packageName, notificationList) {
    const db = firebase.database();
    const uid = this.state.uid;
    const referenceString = 'notification';

    const singleNotificationRef = db
      .ref(referenceString)
      .child(uid)
      .child(packageName);
    singleNotificationRef.on('child_added', snapshot => {
      var storage = firebase.storage();
      var imageRef = storage.ref('images').child(this.state.uid);
      imageRef
        .child(packageName + '.png')
        .getDownloadURL()
        .then(url => {
          //Create browser notification here
          let notification = snapshot.val();
          let notificationId = snapshot.key;
          console.log(notification);
          console.log(notificationId);
          this.createBrowserNotification(
            notification.title,
            notification.text,
            url,
            notificationId
          );
        })
        .catch(function(error) {
          // Handle any error
          console.log('Failed to get image ' + error);
          console.log(error);
        });
    });
    //State keeping for the notification stack list
    let generatedStackList = this.state.notificationStackObject;

    //Reference for each application, loops through all notifications for that app
    const notificationRef = db
      .ref(referenceString)
      .child(uid)
      .child(packageName);
    notificationRef.on('value', snapshot => {
      let notificationList = snapshot.val();
      let packageName = snapshot.key;

      console.log(notificationList);
      console.log(packageName);

      //If the notification list is empty, don't bother rendering
      if (notificationList === null || notificationList.length === 0) {
        delete generatedStackList[packageName];
        console.log(generatedStackList);
      } else {
        //Create notification stack here
        let generatedStack = this.generateNotificationStack(
          packageName,
          notificationList
        );
        generatedStackList[packageName] = generatedStack;
        console.log(generatedStackList);
      }
      this.setState({
        notificationStackObject: generatedStackList,
        notificationStackList: Object.values(generatedStackList),
      });
    });
  }

  /**
   * Generates a notification block
   * @param {Title of the notification} title
   * @param {Text of the notification} text
   * @param {Timestamp of notificaiton, in milliseconds} time
   * @param {Notification id, generated by firebase} notificationId
   * @param {Package name of notification} packageName
   */
  generateNotificationBlock(
    title,
    text,
    time,
    notificationId,
    packageName,
    isBigNotification,
    bigText,
    uid,
    hasLargeIcon
  ) {
    return (
      <Notification
        notificationId={notificationId}
        uid={this.state.uid}
        packageName={packageName}
        title={title}
        timestamp={this.getTimeAgo(time)}
        text={text}
        bigText={bigText}
        hasLargeIcon={hasLargeIcon}
        close={() => this.removeNotification(notificationId, packageName)}
      />
    );
  }

  /**
   * Generates a notification stack, given a list of notifications
   * @param {Name of the package} packageName
   * @param {*List of notification objects} notificationList
   */
  generateNotificationStack(packageName, notificationList) {
    //console.log(notificationList);
    var generatedNotificationBlocks = [];
    for (let notification in notificationList) {
      //console.log(notification);
      let block = this.generateNotificationBlock(
        notificationList[notification].title,
        notificationList[notification].text,
        notificationList[notification].timestamp,
        notification,
        packageName,
        notificationList[notification].isBigNotification,
        notificationList[notification].bigText,
        this.state.uid,
        notificationList[notification].hasLargeIcon
      );
      generatedNotificationBlocks.push(block);
    }

    return (
      <Col xs="6">
        <NotificationStack packageName={packageName} uid={this.state.uid}>
          {generatedNotificationBlocks}
        </NotificationStack>
      </Col>
    );
  }

  /**
   * Removes a given notification
   * @param {ID of the firebase notification} id
   * @param {* Package name of the notification} packageName
   */
  removeNotification(id, packageName) {
    //console.log(id);
    const db = firebase.database();
    const uid = this.state.user.uid;
    const referenceString = 'notification';

    const notificationRef = db.ref(referenceString).child(uid);

    notificationRef
      .child(packageName)
      .child(id)
      .remove();
  }

  /**
   * To prevent unneeded writes to firebase, lets make sure the person
   * is actually on the browser
   * @param {User Id} uid
   */
  establishConnection(uid) {
    var db = firebase.database();
    var ref = db.ref('onlinestate').child(uid);
    ref.onDisconnect().set(false);
    ref.set(true);
  }

  /**
   * Generates a "time ago" string based on a timestamp
   * @param {Timestamp in milliseconds} time
   */
  getTimeAgo(time) {
    const SECOND_MILLIS = 1000;
    const MINUTE_MILLIS = 60 * SECOND_MILLIS;
    const HOUR_MILLIS = 60 * MINUTE_MILLIS;
    const DAY_MILLIS = 24 * HOUR_MILLIS;
    if (time < 1000000000000) {
      // if timestamp given in seconds, convert to millis
      time *= 1000;
    }

    const now = Date.now();
    if (time > now || time <= 0) {
      return 'just now';
    }

    // TODO: localize
    let diff = now - time;
    if (diff < MINUTE_MILLIS) {
      return 'just now';
    } else if (diff < 2 * MINUTE_MILLIS) {
      return 'a minute ago';
    } else if (diff < 50 * MINUTE_MILLIS) {
      return Math.trunc(diff / MINUTE_MILLIS) + ' minutes ago';
    } else if (diff < 90 * MINUTE_MILLIS) {
      return 'an hour ago';
    } else if (diff < 24 * HOUR_MILLIS) {
      return Math.trunc(diff / HOUR_MILLIS) + ' hours ago';
    } else if (diff < 48 * HOUR_MILLIS) {
      return 'yesterday';
    } else {
      return Math.trunc(diff / DAY_MILLIS) + ' days ago';
    }
  }

  handlePermissionGranted() {
    //console.log('Permission Granted');
    this.setState({
      ignore: false,
    });
  }
  handlePermissionDenied() {
    //console.log('Permission Denied');
    this.setState({
      ignore: true,
    });
  }
  handleNotSupported() {
    //console.log('Web Notification not Supported');
    this.setState({
      ignore: true,
    });
  }

  handleNotificationOnClick(e, tag) {
    //console.log(e, 'Notification clicked tag:' + tag);
  }

  handleNotificationOnError(e, tag) {
    //console.log(e, 'Notification error tag:' + tag);
  }

  handleNotificationOnClose(e, tag) {
    //console.log(e, 'Notification closed tag:' + tag);
  }

  handleNotificationOnShow(e, tag) {
    //console.log(e, 'Notification shown tag:' + tag);
  }

  createBrowserNotification(title, text, iconUrl, notificationId) {
    //Permissions aren't allowed, don't bother making one
    if (!this.checkNotificationPermission()) {
      return;
    }

    const tag = notificationId;
    //const icon = 'http://georgeosddev.github.io/react-web-notification/example/Notifications_button_24.png';

    // Available options
    // See https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
    const options = {
      tag: tag,
      body: text,
      icon: iconUrl,
      badge: iconUrl,
      lang: 'en',
    };
    this.setState({
      title: title,
      options: options,
    });
  }

  render() {
    return (
      <div>
        <Header>
          {this.state.user ? (
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                {this.state.displayName}
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem>Account</DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={this.logout}>Log Out</DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          ) : (
            <GoogleButton onClick={this.login} type="light" />
          )}
        </Header>
        <main>
          <Container>
            <Row>
              {!this.state.user ? (
                <Col className="text-center">
                  <h3>Please Sign in</h3>
                </Col>
              ) : this.state.notificationStackList.length == 0 ? (
                <Col className="text-center">
                  <h3>No notifications, you good fam </h3>
                </Col>
              ) : (
                this.state.notificationStackList
              )}
            </Row>
          </Container>
        </main>
        <BrowserNotification
          ignore={false}
          notSupported={this.handleNotSupported.bind(this)}
          onPermissionGranted={this.handlePermissionGranted.bind(this)}
          onPermissionDenied={this.handlePermissionDenied.bind(this)}
          onShow={this.handleNotificationOnShow.bind(this)}
          onClick={this.handleNotificationOnClick.bind(this)}
          onClose={this.handleNotificationOnClose.bind(this)}
          onError={this.handleNotificationOnError.bind(this)}
          timeout={10000}
          title={this.state.title}
          options={this.state.options}
        />
      </div>
    );
  }
}

export default App;
