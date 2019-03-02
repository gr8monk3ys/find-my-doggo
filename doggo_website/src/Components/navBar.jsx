import React, {Component} from "react";

//IMPORT SEMANTIC
import {Menu, Icon} from "semantic-ui-react";

class NavBar extends Component{
    render(){
        return(
            <React.Fragment>
                <Menu>
                    <Menu.Menu position = "left">
                        <Menu.Item>
                            <Icon name = "map"/> Map
                        </Menu.Item>
                        <Menu.Item>
                            <Icon name = "user circle"/> Contact Us
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