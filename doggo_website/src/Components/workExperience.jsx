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
                    Select an Option...
                </center>
                <Divider/>
                <Grid columns = "equal">
                    <Grid.Column width = {8}>
                        <button className = "exp" onClick = {()=>expand(0)}> Lost Dog</button>
                        <div className = "panel">
                            If you lost your dog(s) post your photo(s) here.
                        </div>
                    </Grid.Column>
                    <Grid.Column width = {8}>
                        <button className = "exp" onClick = {()=>expand(1)}> Discovered Dog</button>
                        <div className = "panel">
                            If you found a dog(s), post your photo(s) here.
                        </div>
                    </Grid.Column>
                </Grid>
            </React.Fragment>
        );
    }
}

export default WorkExperience