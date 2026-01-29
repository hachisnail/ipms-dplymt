function NavRenderList({ navList = [] }) {
    return (
        <>
            {navList.map((nav) => (
                <li className="nav-item" key={nav._id}>
                    {nav.children && nav.children.length > 0 && (
                        <ul>
                            <NavRenderList navList={nav.children} />
                        </ul>
                    )}
                </li>
            ))}
        </>
    );
}

export default NavRenderList;