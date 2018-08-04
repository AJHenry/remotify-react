import React, { Component } from 'react';
import {
  Container,
  Navbar,
  NavbarBrand,
  Nav,
} from 'reactstrap';

class Header extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Container>
          <Navbar color="faded" light expand="md">
            <NavbarBrand href="/">Remotify</NavbarBrand>
            <Nav className="ml-auto" navbar>
            <div>
              {this.props.children}
            </div>
            </Nav>
          </Navbar>
        </Container>
      </div>
    );
  }
}

export default Header;
