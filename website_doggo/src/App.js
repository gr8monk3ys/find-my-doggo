import React, { Component } from 'react';

import {Container} from "semantic-ui-react";

//IMPORT COMPONENTS
import NavBar from './Components/navBar';
import SubHeader from "./Components/subHeader";

//IMPORT CSS
import "./Assets/css/menu.css";
import "./Assets/css/Container.css";

class App extends Component {
  
  
  render() {
    return (
      <React.Fragment>
        <NavBar/>
        <SubHeader />
        <Container>
        </Container>
      </React.Fragment>
    );
  }
}

export default App;
