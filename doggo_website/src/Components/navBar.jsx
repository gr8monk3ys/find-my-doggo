import React, {Component} from "react";
import App from "../App";

//IMPORT SEMANTIC
import {Menu, Icon} from "semantic-ui-react";

class NavBar extends Component{
    render(){
        return(
            <React.Fragment>
                <Menu>
                    <Menu.Menu position = "left">
                        <Menu.Item>
                            <Icon name = "home"/> Home
                        </Menu.Item>
                        <Menu.Item>
                            <Icon name = "user circle"/> About Me
                        </Menu.Item>
                        <Menu.Item>
                            <Icon name = "keyboard"/> Work Experience
                        </Menu.Item>
                        <Menu.Item>
                            <Icon name = "code"/> Skills
                        </Menu.Item>
                        <Menu.Item>
                            <Icon name = "github"/> Github
                        </Menu.Item>
                    </Menu.Menu>
                </Menu>

            </React.Fragment>
        );
            
        }
    }

export default NavBar;