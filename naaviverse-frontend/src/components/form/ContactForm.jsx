import React, { Fragment, useState } from 'react';
import axios from 'axios';
import { validatePersonName, validateEmail } from '../../utils/emailValidator';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ContactForm = () => {
    const [statusMessage, setStatusMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [nameVal, setNameVal] = useState('');
    const [nameError, setNameError] = useState('');
    const [emailVal, setEmailVal] = useState('');
    const [emailError, setEmailError] = useState('');
    const [messageVal, setMessageVal] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const nameValidation = validatePersonName(nameVal, "Name");
        if (!nameValidation.isValid) {
            setNameError(nameValidation.message);
            setStatusMessage(nameValidation.message);
            setIsSuccess(false);
            return;
        }
        setNameError('');

        const emailValidation = validateEmail(emailVal);
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.message);
            setStatusMessage(emailValidation.message);
            setIsSuccess(false);
            return;
        }
        setEmailError('');

        if (!messageVal.trim()) {
            setStatusMessage('Please enter a message');
            setIsSuccess(false);
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`${BASE_URL}/api/admin-contact`, {
                fullName: nameValidation.cleanName,
                email: emailValidation.cleanEmail,
                message: messageVal.trim(),
                product: 'OTHER',
                inquiryType: 'OTHER',
                question: 'General Inquiry / Website Question',
                source: 'Contact Form',
            });

            setIsSuccess(true);
            setStatusMessage('Form submitted successfully!');
            setNameVal('');
            setEmailVal('');
            setMessageVal('');
            setNameError('');
            setEmailError('');
        } catch (error) {
            console.error('Error submitting form:', error);
            setIsSuccess(false);
            setStatusMessage(error.response?.data?.message || 'Error submitting the form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Fragment>
            <form id="contact-form" onSubmit={handleSubmit}>
                <div className="row">
                    {/* Name Field */}
                    <div className="col-12">
                        <div className="input-group-meta form-group mb-30">
                            <label>Name*</label>
                            <input
                                type="text"
                                name="name"
                                value={nameVal}
                                onChange={(e) => {
                                    setNameVal(e.target.value);
                                    if (nameError) {
                                        const res = validatePersonName(e.target.value, "Name");
                                        setNameError(res.isValid ? '' : res.message);
                                    }
                                }}
                                onBlur={() => {
                                    const res = validatePersonName(nameVal, "Name");
                                    setNameError(res.isValid ? '' : res.message);
                                }}
                                placeholder="Your Name"
                                className={`form-control ${nameError ? 'is-invalid' : ''}`}
                                required
                            />
                            {nameError && (
                                <div className="text-danger mt-1" style={{ fontSize: '13px' }}>
                                    {nameError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="col-12">
                        <div className="input-group-meta form-group mb-30">
                            <label>Email*</label>
                            <input
                                type="email"
                                name="email"
                                value={emailVal}
                                onChange={(e) => {
                                    setEmailVal(e.target.value);
                                    if (emailError) {
                                        const res = validateEmail(e.target.value);
                                        setEmailError(res.isValid ? '' : res.message);
                                    }
                                }}
                                onBlur={() => {
                                    const res = validateEmail(emailVal);
                                    setEmailError(res.isValid ? '' : res.message);
                                }}
                                placeholder="Your Email"
                                className={`form-control ${emailError ? 'is-invalid' : ''}`}
                                required
                            />
                            {emailError && (
                                <div className="text-danger mt-1" style={{ fontSize: '13px' }}>
                                    {emailError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Field */}
                    <div className="col-12">
                        <div className="input-group-meta form-group mb-30">
                            <label>Message*</label>
                            <textarea
                                name="message"
                                value={messageVal}
                                onChange={(e) => setMessageVal(e.target.value)}
                                placeholder="Your Message"
                                className="form-control"
                                rows="5"
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="col-12">
                        <button type="submit" className="btn-eight ripple-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>

                    {/* Status Message */}
                    <div className="col-12">
                        {statusMessage && (
                            <p className={`mt-2 ${isSuccess ? 'text-success' : 'text-danger'}`}>
                                {statusMessage}
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </Fragment>
    );
};

export default ContactForm;
