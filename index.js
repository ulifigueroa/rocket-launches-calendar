// ########################################################################
// Load app when document is ready
// ########################################################################
document.onreadystatechange = () => {
    const app = new App({ container: 'app' });

    switch (document.readyState) {
        case 'interactive':
            try {
                app.init();
                app.render();
            } catch (err) {
                console.error(err);
            }

            break;
    }
};

// ########################################################################
// Component
// ########################################################################
const Component = function Component() {
    this.oldAttributes = {};
    this.attributes = {};
};

Component.prototype.render = function () {
    return 'Component should implement render.';
};

Component.prototype.setAttributes = function(attributes) {
    this.attributes = attributes;
    this.oldAttributes = attributes;
}

// ########################################################################
// App Component
// ########################################################################
const App = function App({ container }) {
    this.container = document.getElementById(container);

    this.attributes = {
        loading: true
    };

    this.calendar = new Calendar({
        today: new Date,
        view: 'month',
        start: '2017-11-01',
        end: '2017-11-30'
    });

    this.init = () => {
        this.renderEvents(this.calendar.start, this.calendar.end);
    }

    this.renderEvents = (startDate, endDate) => {
        this.getLaunchEvents(startDate, endDate).then((events) => {
            this.calendar.setAttributes({ events });
            this.setAttributes({ loading: false });
            this.render();
        }).catch((err) => { throw err; });
    }
    
    this.getLaunchEvents = (startDate, endDate) => {
        const request = new Request(`https://launchlibrary.net/1.2/launch/${startDate}/${endDate}`);

        return fetch(request).then((response) => {
            return new Promise((resolve, reject) => {
                if (response.status === 200) {
                    try {
                        response.json().then((data) => resolve(this.parseEvents(data)));
                    } catch (err) {
                       reject(err);
                    }
                } else {
                    reject(err);
                }   
            })
        });
    }

    this.parseEvents = ({ launches }) => {
        return launches.map((launch) => {
            return {
                title: launch.name,
                start: launch.windowstart,
                end: launch.windowend
            }
        })
    }
}

App.prototype = Object.create(Component.prototype);

App.prototype.render = function() {
    console.log('App.render');

    if (this.attributes.loading) {
        this.container.innerHTML = 'Loading...';
    } else {
        this.container.innerHTML = this.calendar.render(); 
    }
}

// ########################################################################
// Calendar Component
// ########################################################################
const Calendar = function Calendar({ today, view, start, end }) {
    const views = { 'month': CalendarMonthView }
    const View = views[view] || views['month'];

    this.today = today;
    this.start = start;
    this.end = end;    
    this.view = new View({ ...this});

    this.attributes = {
        events: []
    }
}

Calendar.prototype = Object.create(Component.prototype);

Calendar.prototype.render = function() {
    console.log('Calendar.render');
    this.view.attributes.events = this.attributes.events;
    return this.view.render();
}

// ########################################################################
// Calendar Month View Component
// ########################################################################
const CalendarMonthView = function CalendarMonthView({ today }) {
    this.today = today;
    this.attributes = {
        events: []
    }
}

CalendarMonthView.prototype.render = function () {
    console.log('CalendarMonthView.render');
    const { events } = this.attributes;
    let content = '';

    if (events.length > 0) {
        content = events.map((event) => { return `<li>${event.title}</li>`; });
    } else {
        content = 'No events to show';
    }

    return content;
}

