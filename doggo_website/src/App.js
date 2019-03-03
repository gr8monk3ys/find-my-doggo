import React, { Component } from 'react';

import {Container} from "semantic-ui-react";

//IMPORT COMPONENTS
import NavBar from './Components/navBar';
import FoundOrLost from "./Components/FoundOrLost";
import subHeader from "./Components/subHeader"
import Map from "./Components/map"

//IMPORT CSS
import "./Assets/css/menu.css";
import "./Assets/css/Container.css";



class App extends Component {
  constructor(props){
    super(props)

    this.state = {
      currentPage: 'Home'
    }
  }

  render() {

    return (
      
      <React.Fragment>
        <NavBar/>
        <subHeader/>
        <Container>
        </Container>
      </React.Fragment>
      
      );
  }
  
}

export default App;
