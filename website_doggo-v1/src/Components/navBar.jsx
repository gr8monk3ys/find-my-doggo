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
                        <a onClick href="https://github.com/gr8monk3ys/find_my_doggo">
                        <Menu.Item>
                            <Icon name = "github"/> Github
                        </Menu.Item>
                        </a>

                    </Menu.Menu>
                </Menu>

            </React.Fragment>
        );
            
        }
    }

export default NavBar;