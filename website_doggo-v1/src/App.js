import React, {Component} from 'react';

import {Container} from "semantic-ui-react";

//IMPORT COMPONENTS
import NavBar from './Components/navBar';
import SubHeader from "./Components/subHeader";
import List from './Components/list';

//IMPORT CSS
import "./Assets/css/menu.css";
import "./Assets/css/Container.css";

<<<<<<< HEAD
class App extends Component {
  
=======
class App extends React.Component {
>>>>>>> 1c0aaf44baa39b1cd0ceb515344533bf2b12269e
  
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
