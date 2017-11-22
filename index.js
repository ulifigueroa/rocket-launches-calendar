// ########################################################################
// Load app when document is ready
// ########################################################################
let calendarApp = null;

document.onreadystatechange = () => {
    switch (document.readyState) {
        case 'interactive':
            try {
                calendarApp = new App({ container: 'app' });
                calendarApp.init();
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
    this.attributes = {
        today: null,
        loading: true,
        events: [],
        start: null
    };

    this.init = () => {
        this.attributes.today = new Date();
        this.attributes.start = new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
        
        this.container = document.getElementById(container);
        this.calendar = new Calendar();
        
        this.renderCalendar(this.attributes.start);
    }

    this.getCurrentMonthEvents = () => {
        const { today } = this.attributes;
        const newStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
        this.renderCalendar(newStart);
    }

    this.getNextMonthEvents = () => {
        const { start } = this.attributes;
        const newStart = new Date(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
        this.renderCalendar(newStart);
    };

    this.getPreviousMonthEvents = () => {
        const { start } = this.attributes;
        const newStart = new Date(start.getUTCFullYear(), start.getUTCMonth() - 1, 1);
        this.renderCalendar(newStart);
    };

    this.renderCalendar = (startDate) => {
        const { today } = this.attributes;
        this.setAttributes({ loading: true });
       
        return this.getEvents(startDate).then((events) => {
            this.calendar.setAttributes({ today, events, start: startDate });
            this.setAttributes({ events, start: startDate, loading: false });
        }).catch((err) => { throw err; });
    }
    
    this.getEvents = (startDate) => {
        const endDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0);
        const startDateParameter = startDate.toISOString().substr(0, 10);
        const endDateParameter = endDate.toISOString().substr(0, 10);

        const request = new Request(`https://launchlibrary.net/1.2/launch/${startDateParameter}/${endDateParameter}`);

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
        let hashedEvents = {};

        launches.forEach((launch) => {
            let event = {
                title: launch.name,
                start: new Date(launch.windowstart),
                end: new Date(launch.windowend)
            };
            const eventDay = event.start.getUTCDate();

            hashedEvents[eventDay] = hashedEvents[eventDay] || [];
            hashedEvents[eventDay].push(event); 
        });

        return hashedEvents;
    }
}

App.prototype = Object.create(Component.prototype);

App.prototype.render = function() {
    console.log('App.render');
    const { loading } = this.attributes;

    this.container.innerHTML = loading ?
        '<span class="loading">Loading...</span>' : this.calendar.getHTML();
}

// ########################################################################
// Calendar Component
// ########################################################################
const Calendar = function Calendar() {
    this.html = '';
    this.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                    'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    this.attributes = {
        today: null,
        start: null,
        events: []
    }

    this.renderTitle = function() {
        let html = '';

        html += '<thead><tr>';
        this.days.forEach((day) => html += `<th class="title">${day}</th>`);
        html += '</tr></thead>';

        return html;
    };

    this.isToday = (date) => {
        const { today } = this.attributes;

        return date.getUTCFullYear() === today.getUTCFullYear() &&
            date.getUTCMonth() === today.getUTCMonth() &&
            date.getUTCDate() === today.getUTCDate();
    }

    this.renderEvents = function () {
        const { events, today, start } = this.attributes;
        const firstDayOfMonth = new Date(start.getUTCFullYear(), start.getUTCMonth(), 1);
        const lastDayOfMonth = new Date(start.getUTCFullYear(), start.getUTCMonth() + 1, 0).getUTCDate();
        
        let currentDayNumber = 0;
        let html = '';

        [0, 1, 2, 3, 4].forEach((week) => {
            html += '<tr>';
            [0, 1, 2, 3, 4, 5, 6].forEach((weekDay) => {
                let currentDate = new Date(start.getUTCFullYear(), start.getUTCMonth(), currentDayNumber + 1);

                html += `<td class="day ${this.isToday(currentDate) ? 'today' : ''}">`;

                if (week === 0 && weekDay >= firstDayOfMonth.getUTCDay() ||
                    week > 0 && currentDayNumber < lastDayOfMonth) {
                    html += '<span class="number ">';
                    
                    if (currentDayNumber === 0) {
                        html += `${this.months[start.getUTCMonth()]} `;
                    }

                    html += ++currentDayNumber;
                    html += '</span>';

                    if (events[currentDayNumber]) {                        
                        events[currentDayNumber].forEach((event) => {
                            if (event.start.getUTCMonth() === currentDate.getUTCMonth()) {
                                html += `<span class="event" title="${event.title}">${event.title}</span>`;
                            }
                        });
                    }
                }

                html += '</td>';
            });

            html += '</tr>';
        });

        return html;
    };
}

Calendar.prototype = Object.create(Component.prototype);

Calendar.prototype.render = function() {
    console.log('Calendar.render');
    const month = this.attributes.start.getUTCMonth();
    const year = this.attributes.start.getUTCFullYear();

    this.html = '';
    this.html += '<header>';
    this.html += `<h1>${this.months[month]}, ${year}</h1>`;
    this.html += '<section class="controls">';
    this.html += '<button onClick="calendarApp.getPreviousMonthEvents()">Previous</button>';
    this.html += '<button onClick="calendarApp.getCurrentMonthEvents()">Today</button>';
    this.html += '<button onClick="calendarApp.getNextMonthEvents()">Next</button>';
    this.html += '</header>';

    this.html += '<table class="calendar">';
    this.html += `<thead>${this.renderTitle()}</thead>`;
    this.html += `<tbody>${this.renderEvents()}</tbody>`;
    this.html += '</table>';

    return this.html;
}