const CURRENT_USER_ID = "64e7c3f15d2a7a0017a12345"; //should be the real USER ID from users MODEL
let globalGroups = [];
let currentOpenGroupId = null;

function openGroupsPopup() {
    const overlay = document.getElementById('groupsOverlay');
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex'); // groups popup become visiable
    document.body.style.overflow = 'hidden';
    
    fetch('/api/groups/getGroups') // get all the existing groups
        .then(res => res.json()) // make the response as an object
        .then(data => {
            if(data && data.success) { // success and data were given parameter by the controller response
                globalGroups = data.data; // save all the groups on the global parameter
                filterGroups();  // filter and then render the groups on the screen
            }
        });
}

function closeGroupsPopup(event, forceClose = false) {
    const overlay = document.getElementById('groupsOverlay'); // if the user clicked on the dark background
    
    if (forceClose || event.target === overlay) {
        overlay.classList.remove('d-flex');
        overlay.classList.add('d-none');
        document.body.style.overflow = '';
        // remove the popup
        
        document.getElementById('newGroupName').value = '';
        document.getElementById('groupSearch').value = '';
        document.getElementById('myGroupsFilter').checked = false;
        // reset all the boxes
        
        filterGroups(); // filter and then render the groups on the screen
    }
}

function createGroup() {
    const input = document.getElementById('newGroupName');
    const groupName = input.value.trim();

    if (!groupName || groupName.length > 60) {
        alert("Group name must be between 1 and 60 characters");
        return;
    }

    fetch('/api/groups/createGroup', { // create a new group
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: groupName,
            adminId: CURRENT_USER_ID
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            input.value = '';
            openGroupsPopup(); // refresh the screen
        }
    })
    .catch(err => console.error(err));
}

function filterGroups() {
    const searchTerm = document.getElementById('groupSearch').value.toLowerCase();
    const showOnlyMine = document.getElementById('myGroupsFilter').checked; // if the user want to see only his group he is a member

    const filtered = globalGroups.filter(group => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm); // filter the shown group by their names
        const matchesMine = showOnlyMine ? group.users.includes(CURRENT_USER_ID) : true; // filter the shown groups by "is mine" checkbox
        
        return matchesSearch && matchesMine; // return the groups who go throgh this both conditions
    });

    renderGroups(filtered);
}

function renderGroups(groupsArray) {
    const listContainer = document.getElementById('groupsList');
    listContainer.innerHTML = ''; // reset the element

    groupsArray.forEach(group => {
        const usersArray = group.users || [];
        const isMember = usersArray.includes(CURRENT_USER_ID);
        const isAdmin = group.admin === CURRENT_USER_ID;

        const row = document.createElement('div'); // group div HTML
        row.className = 'd-flex justify-content-between align-items-center mb-2 p-3 border-bottom';

        const nameSpan = document.createElement('span'); // group name HTML
        nameSpan.className = 'fw-bold fs-6 text-dark text-break pe-3';
        nameSpan.style.maxWidth = '55%';
        nameSpan.textContent = group.name || 'Unnamed Group';

        const btnGroup = document.createElement('div'); // buttons div HTML
        btnGroup.className = 'd-flex gap-2 align-items-center flex-shrink-0';

        const usersBtn = document.createElement('button'); // members button HTML
        usersBtn.className = 'btn btn-sm btn-light border fw-semibold rounded-pill px-3';
        usersBtn.textContent = 'Members';
        usersBtn.onclick = () => openMembersPopup(group._id, isAdmin, usersArray);

        btnGroup.appendChild(usersBtn);

        if (isAdmin) { // if is admin then create a delete group button if not then create a join/leave group button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger fw-semibold rounded-pill px-3';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteGroup(group._id, CURRENT_USER_ID);
            btnGroup.appendChild(deleteBtn);
        } else {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = isMember ? 'btn btn-sm btn-secondary fw-semibold rounded-pill px-3' : 'btn btn-sm btn-primary fw-semibold rounded-pill px-3';
            toggleBtn.textContent = isMember ? 'Leave' : 'Join';
            toggleBtn.onclick = () => isMember ? leaveGroup(group._id, CURRENT_USER_ID) : joinGroup(group._id, CURRENT_USER_ID);
            btnGroup.appendChild(toggleBtn);
        }

        row.appendChild(nameSpan);
        row.appendChild(btnGroup);
        listContainer.appendChild(row); // add all the groups div to the HTML
    });
}

function joinGroup(groupID, userID) { // join user to requested group
    fetch(`/api/groups/joinExistingGroup/${groupID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userID })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) openGroupsPopup(); // it will rnder all the groups from start
    });
}

function leaveGroup(groupId, userID) {
    fetch(`/api/groups/leaveExistingGroup/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userID })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) openGroupsPopup();// it will rnder all the groups from start
    });
}

function deleteGroup(groupID, userID) { // delete the group if the user is the admin
    fetch(`/api/groups/deleteSpecificGroup/${groupID}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userID })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) openGroupsPopup(); // it will rnder all the groups from start
    });
}

function openMembersPopup(groupId, isAdmin, usersArray) {
    currentOpenGroupId = groupId;
    const overlay = document.getElementById('membersOverlay');
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex'); // make the members popup visiable
    
    const listContainer = document.getElementById('membersList');
    listContainer.innerHTML = ''; // reset the content

    usersArray.forEach(userId => {
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center mb-2';

        const userSpan = document.createElement('span');
        userSpan.textContent = userId === CURRENT_USER_ID ? 'You' : `User: ${userId.substring(0,6)}...`; // change it to username from users model

        row.appendChild(userSpan);

        if (isAdmin && userId !== CURRENT_USER_ID) {
            const removeBtn = document.createElement('button'); // make remove button for admins
            removeBtn.className = 'btn btn-sm btn-outline-danger';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => removeUser(groupId, userId);
            row.appendChild(removeBtn);
        }

        listContainer.appendChild(row);
    });
}

function closeMembersPopup(event, forceClose = false) {
    const overlay = document.getElementById('membersOverlay');
    if (forceClose || event.target === overlay) {
        overlay.classList.remove('d-flex');
        overlay.classList.add('d-none');
        currentOpenGroupId = null;
    }
}

function removeUser(groupId, userIdToRemove) {
    fetch(`/api/groups/removeUserFromGroup/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: CURRENT_USER_ID, userIdToRemove: userIdToRemove })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            closeMembersPopup(null, true);
            openGroupsPopup(); // refreshing the groups render
        }
    });
}