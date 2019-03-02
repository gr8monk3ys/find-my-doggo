import React, {Component} from 'react';

import {Icon, Divider, Grid} from "semantic-ui-react"

//IMPORT JS 
import {expand} from "../Assets/js/accordion.js";

class WorkExperience extends Component {
    goToLostDog(){
        this.props.switchPage('LostDog')
    } 

    goToFoundDog(){
        this.props.switchPage('FoundDog')
    }

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
                        <button className = "exp" onClick = {this.goToLostDog.bind(this)}> Lost Dog</button>
                        <div className = "panel">
                            If you lost your dog(s) post your photo(s) here.
                        </div>
                    </Grid.Column>
                    <Grid.Column width = {8}>
                        <button className = "exp"onClick = {this.goToFoundDog.bind(this)}> Found Dog</button>
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