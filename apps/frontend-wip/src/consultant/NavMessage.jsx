
function NavMessage() {
    return(
        <>
            <li className="nav-item dropdown">
                <a className="nav-link nav-icon" href="#" data-bs-toggle="dropdown">
                    <i className="bi bi-chat-left-text"></i>
                    <span className="badge bg-success badge-number">3</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow messages">
                    <li className="dropdown-header">
                        You have 3 messages
                        <a href="#">
                            <span className="badge rounded-pill bg-primary p-2 ms-2">
                                View all
                            </span>
                        </a>
                    </li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                    <li className="message-item">
                        <a href="#">
                            <img
                            src="Images/messages-1.png"
                            alt=""
                            className="rounded-circle"></img>
            
                            <div>
                                <h4>Maria Hudson</h4>
                                <p>
                                    I want to ask where I could send my application? 
                                </p>
                                <p>4 hrs ago</p>
                            </div>
                        </a>
                    </li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                    <li className="message-item">
                        <a href="#">
                            <img
                            src="assets/img/messages-2.jpg"
                            alt=""
                            className="rounded-circle"
                            />
                            <div>
                                <h4>Anne Nelson</h4>
                                <p>
                                    "I'm following about my application. How is it?"
                                </p>
                                <p>6 hrs ago</p>
                            </div>
                        </a>
                    </li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                       <li className="message-item">
                        <a href="#">
                            <img
                            src="assets/img/messages-2.jpg"
                            alt=""
                            className="rounded-circle"
                            />
                            <div>
                                <h4>Liam Alson</h4>
                                <p>
                                    How many application can I send?
                                </p>
                                <p>6 hrs ago</p>
                            </div>
                        </a>
                    </li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                    <li className="dropdown-footer">
                        <a href="#"> Show all messages </a>
                    </li>
                </ul>
            </li>
            
        </>
    );
}

export default NavMessage;