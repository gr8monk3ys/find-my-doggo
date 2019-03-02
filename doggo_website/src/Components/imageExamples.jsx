import React, {Component} from 'react';

import {Fade} from "semantic-ui-react"

class NavBar extends Component{
    render(){
        return(
            <React.Fragment>
            <div class="ui fade reveal">
                <div class="visible content">
                    <img src="/images/wireframe/square-image.png" class="ui small image"/>
                </div>
                <div class="hidden content">
                    <img src="/images/avatar/large/ade.jpg" class="FadeImage"/>
                </div>
            </div>
            <div class="ui fade reveal2">
                <div class="visible content">
                    <img src="/images/wireframe/square-image.png" class="FadeImage2"/>
                </div>
                <div class="hidden content">
                    <img src="/images/avatar/large/ade.jpg" class="ui small image"/>
                </div>
            </div>
            </React.Fragment>
        );
    }
}