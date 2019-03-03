import React, {Component} from 'react';

import {Container} from "semantic-ui-react";

//IMPORT COMPONENTS
import NavBar from './Components/navBar';
import SubHeader from "./Components/subHeader";
import List from './Components/list';

//IMPORT CSS
import "./Assets/css/menu.css";
import "./Assets/css/Container.css";

class App extends React.Component {
  
  render() {
    return (
      <React.Fragment>
        <NavBar/>
        <SubHeader/>
        <Container/> 
        <List />
      </React.Fragment>

    );
  }
}

export default App;
