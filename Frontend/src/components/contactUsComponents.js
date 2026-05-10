import { Link } from "react-router-dom";


const ContactSectionComponents = () => {

    return (

        <div className='contact_us' >

            <div className="contact_us_center" >

               <h5>Relay</h5> 

               <Link to={"/setuptrade"} className="contact_us_center_button" >
                Try Now
               </Link>

            </div>

        </div>

    );

}

export default ContactSectionComponents;
