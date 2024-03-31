    import React, {Component} from 'react';
    import {Image} from "semantic-ui-react";

    // IMPORT IMAGES 
    import image from "../Assets/img/n02102318_234.jpg";
    import image from "../Assets/img/n02106662_320.jpg";

    class image extends Component {
        render(){
            return(
                <div class="ui segment">
                <img class="ui small left floated image" src="../Assets/img/n02102318_234.jpg"/>
                <p>Here are some of the following examples of dog pictures that we have or could utilize into our machine learning model.</p>
                <img class="ui small right floated image" src="../Assets/img/n02106662_320.jpg"/>
                <p>What our model does is it takes the image of the dog and then determines what type of breed it is. This is done using the AutoML feature in GCP platform.</p>
                <p>We would love to implement more comparisons with our machine learning model so that it is able to compare several dogs within the vicinity in order to help the owner find their dog.</p>
                </div>
            );
        }
    } 

    export default Image