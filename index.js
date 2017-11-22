// ########################################################################
// Load app when document is ready
// ########################################################################
document.onreadystatechange = () => {
    const app = new App({ container: 'app' });

    switch (document.readyState) {
        case 'interactive':
            try {
                app.init();
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
    this.html = '';
};

// Reflect changes on the HTML based on attributes
Component.prototype.render = function () {
    return this.html;
};

// Render component when attributes change
Component.prototype.setAttributes = function(attributes) {
    this.oldAttributes = this.attributes;
    this.attributes = Object.assign(this.attributes, attributes);

    this.render();
}

Component.prototype.getHTML = function () {
    return this.html;
};

// ########################################################################
// App Component
// ########################################################################
const App = function App({ container }) {
    this.container = document.getElementById(container);

    this.attributes = {
        loading: true,
        today: new Date(),
        view: 'month',
        start: '2017-11-01',
        end: '2017-11-30',
        events: []
    };

    this.init = () => {
        this.calendar = new Calendar(this.attributes);
        this.renderCalendar(this.attributes.start, this.attributes.end);
    }

    this.renderCalendar = (startDate, endDate) => {
        this.setAttributes({ loading: true });
       
        return this.getLaunchEvents(startDate, endDate).then((events) => {
            this.calendar.setAttributes({ events });
            this.setAttributes({ events, loading: false });
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
                    reject(response);
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
    const { loading } = this.attributes;

    this.container.innerHTML = loading ? '<span class="loading">Loading...</span>' : this.calendar.getHTML();
}

// ########################################################################
// Calendar Component
// ########################################################################
const Calendar = function Calendar(attributes) {
    this.html = '';
    this.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.attributes = {
        today: null,
        start: null,
        end: null,
        events: []
    }
    
    this.attributes.today = attributes.today;
    this.attributes.start = attributes.start;
    this.attributes.end = attributes.end;    
}

Calendar.prototype = Object.create(Component.prototype);

Calendar.prototype.render = function() {
    console.log('Calendar.render');
    const { events, today } = this.attributes;
    const currentMonth = today.getMonth();
    const firstDayOfMonth = new Date(today.getFullYear(), currentMonth, 1);
    const firstWeekDayOfMonth = firstDayOfMonth.getDay();
    const lastDayOfMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
    
    let currentDay = 0;

    if (events.length > 0) {

        this.html = `<h1>${this.months[currentMonth]}</h1>`;

        this.html += '<table class="calendar">';

        this.html += '<thead><tr>';
        this.days.forEach((day) => this.html += `<th class="title">${day}</th>`);
        this.html += '</tr></thead>';

        this.html += '<tbody>';

        [0, 1, 2, 3, 4].forEach((week) => {
            this.html += '<tr>';
            [0, 1, 2, 3, 4, 5, 6].forEach((weekDay) => {
                this.html += `<td class="day ${today.getDate() === currentDay + 1 ? 'today' : ''}">`;

                if (week === 0 && weekDay >= firstWeekDayOfMonth ||
                    week > 0 && currentDay <= lastDayOfMonth) {
                    this.html += `<span class="number ">${++currentDay}</span>`;

                    // if () {
                    //     this.html += events.map((event) => { return `<tr><td>${event.title}</td></tr>`; });
                    // }
                }

                this.html += '</td>';
            });
            this.html += '</tr>';
        });

        this.html += '</tbody>';

        this.html += '</table>';
    } else {
        this.html = 'No events to show';
    }

    return this.html;
}