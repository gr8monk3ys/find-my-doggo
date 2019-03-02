import React, {Component} from "react";

import image from "../Assets/img/Doggo logo.JPG";

class SubHeader extends Component {
    render(){
        return(
            <React.Fragment>
                <div className = "box">
                    <img className = "subHeaderImage" src = {image}/>
                    <div className = "headerText"> Find My Doggo </div>
                </div>
            </React.Fragment>

        );
    }
} 

export default SubHeader