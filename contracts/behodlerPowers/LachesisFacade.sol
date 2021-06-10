abstract contract LachesisFacade {
    function measure(
        address token,
        bool valid,
        bool burnable
    ) public virtual;

    function updateBehodler(address token) public virtual;
}
