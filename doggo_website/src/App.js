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

  switchPage(pageName) {
    this.setState({ currentPage: pageName });
  }

  render() {

    const PAGE_NAMES = {
      Home: <FoundOrLost switchPage={this.switchPage.bind(this)} />,
      LostDog: <FoundOrLost switchPage={this.switchPage.bind('LostDog')} />,
      DiscoveredDog: <FoundOrLost switchPage={this.switchPage.bind('FoundDog')} />,
    }

    return (
      
      <React.Fragment>
        <NavBar/>
        <subHeader/>
        <Container>
        {PAGE_NAMES[this.state.currentPage]}
        </Container>
      </React.Fragment>
      
      );
  }
  
}

export default App;
