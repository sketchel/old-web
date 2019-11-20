const sketchelapp = {
    panels: {
        notifications: {
            visible: false,
            open() {
                if(this.visible == false) {
                    this.visible = true;
                    document.getElementById("notification-panel").style.opacity = 1;
                    document.getElementById("notification-panel").style.marginTop = '0px';
                    document.getElementById("notification-panel").style.pointerEvents = 'all';
                } else {
                    this.visible = false;
                    document.getElementById("notification-panel").style.opacity = 0;
                    document.getElementById("notification-panel").style.marginTop = '5px';
                    document.getElementById("notification-panel").style.pointerEvents = 'none';
                }
            },
            close() {
                this.visible = false;
                document.getElementById("notification-panel").style.opacity = 0;
                document.getElementById("notification-panel").style.marginTop = '5px';
                document.getElementById("notification-panel").style.pointerEvents = 'none';
            }
        }
    }
};