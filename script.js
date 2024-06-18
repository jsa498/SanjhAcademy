document.addEventListener('DOMContentLoaded', () => {
    const attendanceSection = document.getElementById('attendance-section');
    const teacherSigninSection = document.getElementById('teacher-signin-section');
    const studentMasterSection = document.getElementById('student-master-section');
    const registerStudentSection = document.getElementById('register-student-section');
    const registerTeacherSection = document.getElementById('register-teacher-section');
    const attendanceTab = document.getElementById('attendance-tab');
    const teacherSigninTab = document.getElementById('teacher-signin-tab');
    const studentMasterTab = document.getElementById('student-master-tab');
    const registerStudentTab = document.getElementById('register-student-tab');
    const registerTeacherTab = document.getElementById('register-teacher-tab');
    const editTeacherModal = document.getElementById('edit-teacher-modal');
    const closeModalButton = document.querySelector('.close');
    const editTeacherForm = document.getElementById('edit-teacher-form');
    const editTeacherIndex = document.getElementById('edit-teacher-index');
    const editTeacherName = document.getElementById('edit-teacher-name');
    const editTeacherContact = document.getElementById('edit-teacher-contact');
    const editTeacherGroup = document.getElementById('edit-teacher-group');
    const editTeacherOccupation = document.getElementById('edit-teacher-occupation');
    const deleteTeacherButton = document.getElementById('delete-teacher-button');

    const tabs = [attendanceTab, teacherSigninTab, studentMasterTab, registerStudentTab, registerTeacherTab];
    const sections = [attendanceSection, teacherSigninSection, studentMasterSection, registerStudentSection, registerTeacherSection];

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            sections[index].classList.add('active');
        });
    });

    attendanceTab.classList.add('active');
    attendanceSection.classList.add('active');

    const TEACHERS_KEY = 'saanjh-teachers';
    const STUDENTS_KEY = 'saanjh-students';
    const ATTENDANCE_KEY = 'saanjh-attendance';
    const SIGNIN_KEY = 'saanjh-signin';

    const teachers = JSON.parse(localStorage.getItem(TEACHERS_KEY)) || [];
    const students = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
    const attendance = JSON.parse(localStorage.getItem(ATTENDANCE_KEY)) || {};
    const signin = JSON.parse(localStorage.getItem(SIGNIN_KEY)) || {};

    const groupOrder = ["S-3", "S-2", "S-1", "1", "2", "3", "B"];
    const groupSelect = document.getElementById('group-select');
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');

    function populateGroupSelect() {
        groupSelect.innerHTML = '';
        groupOrder.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });
    }
    populateGroupSelect();

    function populateYearSelect(selectElement) {
        selectElement.innerHTML = '';
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 10; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            selectElement.appendChild(option);
        }
    }
    populateYearSelect(yearSelect);
    populateYearSelect(document.getElementById('signin-year-select'));

    function populateMonthSelect(selectElement) {
        selectElement.innerHTML = '';
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            selectElement.appendChild(option);
        });
    }
    populateMonthSelect(monthSelect);
    populateMonthSelect(document.getElementById('signin-month-select'));

    function getSundays(year, month) {
        const date = new Date(year, month - 1, 1);
        const sundays = [];
        while (date.getMonth() === month - 1) {
            if (date.getDay() === 0) {
                sundays.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return sundays;
    }

    function updateAttendanceTable() {
        const group = groupSelect.value;
        const year = yearSelect.value;
        const month = monthSelect.value;
        if (!group || !year || !month) return;

        if (!attendance[group]) {
            attendance[group] = {};
        }

        const key = `${year}-${month}`;
        if (!attendance[group][key]) {
            attendance[group][key] = students.filter(student => student.group === group).map(student => ({
                name: student.name,
                status: {}
            }));
            localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
        }

        const sundays = getSundays(year, month);
        const records = attendance[group][key];
        attendanceTable.innerHTML = '';
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Student Name</th>';
        sundays.forEach(sunday => {
            const th = document.createElement('th');
            th.textContent = sunday.toISOString().split('T')[0];
            headerRow.appendChild(th);
        });
        attendanceTable.appendChild(headerRow);

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${record.name}</td>`;
            sundays.forEach(sunday => {
                const dateKey = sunday.toISOString().split('T')[0];
                const status = record.status[dateKey] || '';
                row.innerHTML += `
                    <td>
                        <select class="attendance-status" data-student="${record.name}" data-date="${dateKey}">
                            <option value="" ${status === '' ? 'selected' : ''}>Select</option>
                            <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
                            <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                        </select>
                    </td>
                `;
            });
            attendanceTable.appendChild(row);
        });

        document.querySelectorAll('.attendance-status').forEach(select => {
            select.addEventListener('change', (event) => {
                const studentName = event.target.dataset.student;
                const date = event.target.dataset.date;
                const status = event.target.value;
                const record = records.find(r => r.name === studentName);
                if (!record.status) {
                    record.status = {};
                }
                record.status[date] = status;
                localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
                updateAttendanceColors();
            });
        });

        updateAttendanceColors();
    }

    function updateAttendanceColors() {
        document.querySelectorAll('.attendance-status').forEach(select => {
            const status = select.value;
            select.parentElement.className = status === 'Present' ? 'present' : status === 'Absent' ? 'absent' : '';
        });
    }

    function updateTeacherSigninTable() {
        const year = document.getElementById('signin-year-select').value;
        const month = document.getElementById('signin-month-select').value;
        if (!year || !month) return;

        if (!signin[year]) {
            signin[year] = {};
        }
        if (!signin[year][month]) {
            signin[year][month] = teachers.map(teacher => ({
                name: teacher.name,
                group: teacher.group,
                number: teacher.number,
                occupation: teacher.occupation,
                status: {}
            }));
            localStorage.setItem(SIGNIN_KEY, JSON.stringify(signin));
        }

        const sundays = getSundays(year, month);
        const records = signin[year][month];
        const teacherSigninTable = document.getElementById('teacher-signin-table').querySelector('tbody');
        teacherSigninTable.innerHTML = '';
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Teacher Name</th><th>Occupation</th><th>Contact</th>';
        sundays.forEach(sunday => {
            const th = document.createElement('th');
            th.textContent = sunday.toISOString().split('T')[0];
            headerRow.appendChild(th);
        });
        teacherSigninTable.appendChild(headerRow);

        // Sort records by occupation: Admin, Teacher, Volunteer
        records.sort((a, b) => {
            const occupationOrder = { 'Admin': 1, 'Teacher': 2, 'Volunteer': 3 };
            return occupationOrder[a.occupation] - occupationOrder[b.occupation];
        });

        records.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.name}</td>
                <td>${record.occupation}</td>
                <td>${record.number}</td>
            `;
            sundays.forEach(sunday => {
                const dateKey = sunday.toISOString().split('T')[0];
                const status = record.status[dateKey] || '';
                row.innerHTML += `
                    <td class="signin-status-cell">
                        <select class="signin-status" data-teacher="${record.name}" data-date="${dateKey}">
                            <option value="" ${status === '' ? 'selected' : ''}>Select</option>
                            <option value="9am-11am" ${status === '9am-11am' ? 'selected' : ''}>9am-11am</option>
                            <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                            <option value="Late" ${typeof status === 'object' && status.status === 'Late' ? 'selected' : ''}>Late</option>
                        </select>
                        <span class="late-time" ${typeof status !== 'object' || status.status !== 'Late' ? 'style="display:none;"' : ''} data-teacher="${record.name}" data-date="${dateKey}">${typeof status === 'object' && status.status === 'Late' ? status.time : ''}</span>
                    </td>
                `;
            });
            row.innerHTML += `
                <td>
                    <button class="edit-teacher" data-index="${index}">Edit</button>
                </td>
            `;
            teacherSigninTable.appendChild(row);
        });

        document.querySelectorAll('.signin-status').forEach(select => {
            select.addEventListener('change', (event) => {
                const teacherName = event.target.dataset.teacher;
                const date = event.target.dataset.date;
                const status = event.target.value;
                const record = records.find(r => r.name === teacherName);
                if (!record.status) {
                    record.status = {};
                }
                if (status === 'Late') {
                    const time = prompt('Please enter the sign-in time (HH:MM)', '09:00');
                    if (time) {
                        record.status[date] = { status, time };
                        document.querySelector(`.late-time[data-teacher="${teacherName}"][data-date="${date}"]`).textContent = time;
                        document.querySelector(`.late-time[data-teacher="${teacherName}"][data-date="${date}"]`).style.display = 'inline';
                    }
                } else {
                    record.status[date] = status;
                    document.querySelector(`.late-time[data-teacher="${teacherName}"][data-date="${date}"]`).style.display = 'none';
                }
                localStorage.setItem(SIGNIN_KEY, JSON.stringify(signin));
                updateSigninColors();
            });
        });

        document.querySelectorAll('.edit-teacher').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                const teacher = records[index];
                editTeacherIndex.value = index;
                editTeacherName.value = teacher.name;
                editTeacherContact.value = teacher.number;
                editTeacherGroup.value = teacher.group;
                editTeacherOccupation.value = teacher.occupation;
                editTeacherModal.style.display = 'block';
            });
        });

        updateSigninColors();
    }

    function updateSigninColors() {
        document.querySelectorAll('.signin-status-cell').forEach(cell => {
            const statusSelect = cell.querySelector('.signin-status');
            const lateTime = cell.querySelector('.late-time');
            const status = statusSelect.value;
            cell.className = 'signin-status-cell';
            if (status === '9am-11am') {
                cell.classList.add('present');
            } else if (status === 'Absent') {
                cell.classList.add('absent');
            } else if (status === 'Late') {
                if (lateTime.textContent) {
                    const [hours, minutes] = lateTime.textContent.split(':').map(Number);
                    if (hours > 9 || (hours === 9 && minutes > 0)) {
                        cell.classList.add('late');
                    }
                }
            }
        });
    }

    closeModalButton.addEventListener('click', () => {
        editTeacherModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === editTeacherModal) {
            editTeacherModal.style.display = 'none';
        }
    });

    editTeacherForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const index = editTeacherIndex.value;
        teachers[index].name = editTeacherName.value;
        teachers[index].number = editTeacherContact.value;
        teachers[index].group = editTeacherGroup.value;
        teachers[index].occupation = editTeacherOccupation.value;
        localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
        updateTeacherSigninTable();
        editTeacherModal.style.display = 'none';
    });

    deleteTeacherButton.addEventListener('click', () => {
        const index = editTeacherIndex.value;
        teachers.splice(index, 1);
        localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
        updateTeacherSigninTable();
        editTeacherModal.style.display = 'none';
    });

    const registerStudentForm = document.getElementById('register-student-form');
    registerStudentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('student-name').value;
        const guardian = document.getElementById('guardian-name').value;
        const contact = document.getElementById('student-contact').value;
        const group = document.getElementById('student-group').value;
        const grade = document.getElementById('student-grade').value;
        const dobYear = document.getElementById('student-dob-year').value;
        const dobMonth = document.getElementById('student-dob-month').value;
        const dobDay = document.getElementById('student-dob-day').value;
        const dob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
        const feesStatus = document.getElementById('fees-status').value;
        const feesReceived = document.getElementById('fees-received').value;
        const student = { name, guardian, contact, group, grade, dob, feesStatus, feesReceived };
        students.push(student);
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
        updateStudentMasterTable();
        registerStudentForm.reset();

        if (!attendance[group]) {
            attendance[group] = {};
        }

        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 10; year--) {
            for (let month = 1; month <= 12; month++) {
                const key = `${year}-${month}`;
                if (!attendance[group][key]) {
                    attendance[group][key] = [];
                }
                attendance[group][key].push({ name, status: {} });
            }
        }
        localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
        updateAttendanceTable();
    });

    function updateStudentMasterTable() {
        const studentMasterTable = document.getElementById('student-master-table').querySelector('tbody');
        studentMasterTable.innerHTML = '';
        students.sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));
        students.forEach((student, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.group}</td>
                <td>${student.name}</td>
                <td>${student.guardian}</td>
                <td>${student.contact}</td>
                <td>${student.grade}</td>
                <td>${student.dob}</td>
                <td>${student.feesStatus}</td>
                <td>${student.feesReceived}</td>
                <td>
                    <button class="edit-student" data-index="${index}">Edit</button>
                    <button class="delete-student" data-index="${index}">Delete</button>
                </td>
            `;
            studentMasterTable.appendChild(row);
        });

        document.querySelectorAll('.edit-student').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                const student = students[index];
                document.getElementById('student-name').value = student.name;
                document.getElementById('guardian-name').value = student.guardian;
                document.getElementById('student-contact').value = student.contact;
                document.getElementById('student-group').value = student.group;
                document.getElementById('student-grade').value = student.grade;
                const [year, month, day] = student.dob.split('-');
                document.getElementById('student-dob-year').value = year;
                document.getElementById('student-dob-month').value = month;
                document.getElementById('student-dob-day').value = day;
                document.getElementById('fees-status').value = student.feesStatus;
                document.getElementById('fees-received').value = student.feesReceived;
                students.splice(index, 1);
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
                updateStudentMasterTable();
            });
        });

        document.querySelectorAll('.delete-student').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.dataset.index;
                students.splice(index, 1);
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
                updateStudentMasterTable();
            });
        });
    }
    updateStudentMasterTable();

    const registerTeacherForm = document.getElementById('register-teacher-form');
    registerTeacherForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('teacher-name').value;
        const contact = document.getElementById('teacher-contact').value;
        const group = document.getElementById('teacher-group').value;
        const occupation = document.getElementById('teacher-occupation').value;
        const teacher = { name, group: group || '', number: contact, occupation };
        teachers.push(teacher);
        localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));

        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= currentYear - 10; year--) {
            for (let month = 1; month <= 12; month++) {
                if (!signin[year]) {
                    signin[year] = {};
                }
                if (!signin[year][month]) {
                    signin[year][month] = [];
                }
                signin[year][month].push({
                    name,
                    group: group || '',
                    number: contact,
                    occupation,
                    status: {}
                });
            }
        }

        localStorage.setItem(SIGNIN_KEY, JSON.stringify(signin));
        updateTeacherSigninTable();
        registerTeacherForm.reset();
    });

    groupSelect.addEventListener('change', updateAttendanceTable);
    yearSelect.addEventListener('change', updateAttendanceTable);
    monthSelect.addEventListener('change', updateAttendanceTable);

    document.getElementById('signin-year-select').addEventListener('change', updateTeacherSigninTable);
    document.getElementById('signin-month-select').addEventListener('change', updateTeacherSigninTable);

    updateAttendanceTable();
    updateTeacherSigninTable();
});