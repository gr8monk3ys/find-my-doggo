import React, {Component} from 'react';

import {Icon, Divider, Grid} from "semantic-ui-react"

//IMPORT JS 
import {expand} from "../Assets/js/accordion.js";

class WorkExperience extends Component {
    render(){
        return(
            <React.Fragment>
                <center className = 'subtitle'>
                    <Icon name = "keyboard"/><br/>
                    Work Experience
                </center>
                <Divider/>
                <Grid columns = "equal">
                    <Grid.Column width = {8}>
                        <button className = "exp" onClick = {()=>expand(0)}> Hello 1</button>
                        <div className = "panel">
                            HELLO THERE
                        </div>
                    </Grid.Column>
                    <Grid.Column width = {8}>
                        <button className = "exp" onClick = {()=>expand(1)}> Hello 2</button>
                        <div className = "panel">
                            HELLO THERE
                        </div>
                    </Grid.Column>
                </Grid>
            </React.Fragment>
        );
    }
}

export default WorkExperience