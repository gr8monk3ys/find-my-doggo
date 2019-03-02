import React, {Component} from 'react';

//IMPORT SEMANTIC  
import{Icon, Divider} from "semantic-ui-react";

class AboutMe extends Component {
    render(){
        return(
            <React.Fragment>
                <center className = 'subtitle'>
                    <Icon name = "user circle
                    +/><br/>
                    About Me 
                </center>
                <Divider/>
                <p>
                The first thing to see, looking away over the water, was a kind of dull line; that was the woods on t’other side–you couldn’t make nothing else out; then a pale place in the sky; then more paleness, spreading around; then the rive softened up, away off, and warn’t black any more, but gray; you could see little dark spots drifting along ever so far away–trading scows, and such things; and long black streaks? rafts; sometimes you could hear a sweep screaking; or jumbled up voices, it was so still, and sounds come so far; and by-and-by you could see a streak on the water which you know by the look of the streak that there’s a snag there in the swift current which breaks on it and makes that streak look that way; and you see the mist curl up off of the water, and the east reddens up, and the river, and you make out a log cabin in the edge of the woods, away on the bank on t’other side of the river, being a woodyard, likely, and piled by them cheats so y
                </p>
            </React.Fragment>
        );
    }
} export  default AboutMe;