import React, { Component } from 'react';
import { Col, Row } from 'reactstrap'
import './notification_stack.css';
import firebase, { auth, provider } from './firebase.js';

class Notification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imgUrl: '',
            uid: this.props.uid,
            packageName: this.props.packageName,
            notificationId: this.props.notificationId,
            imgStatus: false,
            iconDownloaderHandle: 0,
        }

        if (this.props.hasLargeIcon) {
            this.getInitialIcon();
        }
    }

    /**
     * Method used for retrying to get an image from firebase
     * Happens when the app isn't finished uploading the image 
     * when we ask for it
     * 
     */
    getIconUrlRetry() {
        //Create an interval to retry the download in case it fails
        var retryCount = 0;
        var iconDownloaderHandle = setInterval(() => {
            console.log("retry count " + retryCount);
            if (retryCount >= 3) {
                clearInterval(iconDownloaderHandle);
            }

            // Create a reference with an initial file path and name
            var storage = firebase.storage();
            var imageRef = storage.ref('images').child(this.state.uid).child(this.state.packageName);

            console.log(this.state.packageName);
            console.log(this.state.uid);

            imageRef.child(this.state.notificationId + ".png").getDownloadURL().then((url) => {
                //Download successful, clear interval
                clearInterval(iconDownloaderHandle);
                this.setState({
                    imgUrl: url,
                });

            }).catch((error) => {
                //Download failed, retry the download and increase retry count
                retryCount++;

                // Log the error
                console.log("Failed to get notification image retry");
                console.log(error);
            });
        }, 1500);
    }

    /**
     * Method called when we want to initially get the notification icon
     */
    getInitialIcon() {
        // Create a reference with an initial file path and name
        var storage = firebase.storage();
        var imageRef = storage.ref('images').child(this.state.uid).child(this.state.packageName);

        imageRef.child(this.state.notificationId + ".png").getDownloadURL().then((url) => {
            this.setState({
                imgUrl: url,
            });

        }).catch((error) => {
            //Download failed, lets initiate a retry
            this.getIconUrlRetry();

            // Log the error
            console.log("Failed to get notification image initally");
            console.log(error);
        });
    }

    render() {
        return (
            <div className="notification d-flex flex-row">
                <div className="titles-icon d-flex justify-content-start">
                    {this.state.imgUrl ?
                        <div className="notification-icon d-flex justify-content-start">
                            <img src={this.state.imgUrl} className="rounded float-left"></img>
                        </div>
                        :
                        null
                    }
                </div>
                <div className="notification-info">
                    <div className="notification-heading d-flex flex-row justify-content-between mb-2">

                        <div className="titles">
                            <h5 className="text-left mb-0">{this.props.title}</h5>
                        </div>
                        <div className="time">
                            <small className="text-right text-muted">{this.props.timestamp}</small>
                        </div>
                    </div>
                    <div className="notification-body">
                        {this.props.text}
                    </div>
                    <div className="notification-footer">
                    </div>
                </div>
                <div className="notification-options d-flex flex-column justify-content-between">
                    <ion-icon onClick={this.props.close} name="close"></ion-icon>
                    {!this.props.bigText ?
                        null
                        :
                        <ion-icon name="ios-arrow-down"></ion-icon>
                    }

                </div>
            </div>
        );
    }
}

export default Notification;