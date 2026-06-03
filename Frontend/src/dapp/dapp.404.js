import React from "react";
import { Link } from "react-router-dom";
import { BiErrorCircle } from "react-icons/bi";
import DappHeader from "../components/DappHeader";

const NotFoundDapp = ({ closeHeader }) => {
  return (
    <div className="Otc_main">
      <DappHeader title="404 NOT FOUND" closeHeader={closeHeader} showNetwork={false} />

      <div className="Otc_main_body" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '6rem 2rem', textAlign: 'center'
      }}>
        <BiErrorCircle size={80} color="#0097FF" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 style={{ fontFamily: 'var(--syne)', fontSize: '2.5rem', color: '#E1E1E3', marginBottom: '1rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontFamily: 'var(--raleway)', color: '#BBBEC6', fontSize: '1rem', maxWidth: '500px', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          The Relay portal route you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" style={{
          background: 'var(--linearBg)',
          padding: '0.8rem 1.8rem',
          borderRadius: '8px',
          color: '#fff',
          fontFamily: 'var(--raleway)',
          fontWeight: 'bold',
          textDecoration: 'none',
          fontSize: '0.9rem'
        }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundDapp;
