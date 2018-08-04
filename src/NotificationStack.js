import React, { Component } from 'react';
import { Col, Row } from 'reactstrap';
import Notification from './Notification';
import './notification_stack.css';
import firebase, { auth, provider } from './firebase.js';

class NotificationStack extends Component {

    constructor(props) {
        super(props);
        this.state = {
            imgUrl: '',
            uid: this.props.uid,
            packageName: this.props.packageName,
        }
    }

    getIconUrl() {
        // Create a reference with an initial file path and name
        var storage = firebase.storage();
        var imageRef = storage.ref('images').child(this.state.uid);

        console.log(this.state.packageName);
        console.log(this.state.uid);
        
        
        imageRef.child(this.state.packageName+".png").getDownloadURL().then((url) => {
            this.setState({
                imgUrl: url,
            })
        }).catch(function (error) {
            // Handle any error
            console.log("Failed to get image " + error)
            console.log(error);
        });
    }

    

    componentDidMount() {
        this.getIconUrl();
    }

    render() {
        return (
            <div className="notification-base">
                <Row>
                    <Col xs="2">
                        <div className="app-icon d-flex justify-content-start">
                            <img src={this.state.imgUrl} className="rounded float-left"></img>
                        </div>
                    </Col>
                    <Col xs="10">
                        <div className="notification-stack">
                            {this.props.children}
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default NotificationStack;