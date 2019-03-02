import React, {Component} from "react";

import image from "../Assets/img/subHeader.png";

class SubHeader extends Component {
    render(){
        return(
            <React.Fragment>
                <div className = "box">
                    <img className = "subHeaderImage" src = {image}/>
                    <div className = "headerText">Hello World</div>
                </div>
            </React.Fragment>

        );
    }
} 

export default SubHeader