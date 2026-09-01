let globalGroups = [];
let currentOpenGroupId = null;
let pendingHighlightGroupId = null;
let isCreatingGroup = false;

function showGroupError(element, msg) {
    let errorDiv = element.parentNode.querySelector(':scope > .group-action-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'group-action-error text-danger small mt-2 fw-bold w-100';
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
    }
    errorDiv.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i>${msg}`;
}

function clearGroupError(element) {
    let errorDiv = element.parentNode.querySelector(':scope > .group-action-error');
    if (errorDiv) errorDiv.remove();
}

function openGroupsPopup() {
    const overlay = document.getElementById('groupsOverlay');
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex'); // groups popup become visiable
    document.body.style.overflow = 'hidden';
    
    const input = document.getElementById('newGroupName');
    input.setAttribute('maxlength', '60');
    
    let counterDiv = document.getElementById('create-group-counter');
    if (!counterDiv) {
        counterDiv = document.createElement('div');
        counterDiv.id = 'create-group-counter';
        counterDiv.className = 'text-muted small mt-1 w-100';
        input.parentElement.parentNode.insertBefore(counterDiv, input.parentElement.nextSibling);
    }
    counterDiv.textContent = `${input.value.length}/60`;
    
    input.oninput = () => {
        counterDiv.textContent = `${input.value.length}/60`;
        clearGroupError(input.parentElement);
    };

    filterGroups(); // filter and then render the groups on the screen
}

function closeGroupsPopup(event, forceClose = false) {
    const overlay = document.getElementById('groupsOverlay'); // if the user clicked on the dark background
    
    if (forceClose || event.target === overlay) {
        overlay.classList.remove('d-flex');
        overlay.classList.add('d-none');
        document.body.style.overflow = '';
        // remove the popup
        
        const input = document.getElementById('newGroupName');
        input.value = '';
        clearGroupError(input.parentElement);
        clearGroupError(document.getElementById('groupSearch'));
        
        const counterDiv = document.getElementById('create-group-counter');
        if (counterDiv) counterDiv.textContent = `0/60`;

        clearGroupSearch(); // reset all the boxes and fetch default groups
    }
}

function clearGroupSearch() { // clear advanced search inputs
    document.getElementById('groupSearch').value = '';
    document.getElementById('myGroupsFilter').checked = false;
    
    const timeFilter = document.getElementById('groupTimeFilter');
    if (timeFilter) timeFilter.value = 'all';
    
    clearGroupError(document.getElementById('groupSearch'));
    filterGroups(); // filter and then render the groups on the screen
}

function createGroup() {
    if (isCreatingGroup) return;

    const input = document.getElementById('newGroupName');
    const groupName = input.value.trim();
    const inputContainer = input.parentElement;

    clearGroupError(inputContainer);

    if (!groupName || groupName.length > 60) {
        showGroupError(inputContainer, "Group name must be between 1 and 60 characters");
        return;
    }

    isCreatingGroup = true;

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
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to create group");
        return data;
    })
    .then(data => {
        if (data.success) {
            input.value = '';
            document.getElementById('create-group-counter').textContent = `0/60`;
            pendingHighlightGroupId = data.data._id; // scroll down and highk+lighting a new group were made
            openGroupsPopup(); // refresh the screen
            // Refresh the feed posts to reflect changes in group membership
            fetchPostsFromServer();
        }
    })
    .catch(err => {
        showGroupError(inputContainer, err.message);
    })
    .finally(() => {
        isCreatingGroup = false;
    });
}

async function filterGroups() { // executes the advanced search via server
    const searchInput = document.getElementById('groupSearch');
    const searchTerm = searchInput.value.trim();
    const showOnlyMine = document.getElementById('myGroupsFilter').checked; // if the user want to see only his group he is a member
    
    clearGroupError(searchInput);
    
    let timeFilter = 'all';
    const timeFilterElement = document.getElementById('groupTimeFilter');
    if (timeFilterElement) {
        timeFilter = timeFilterElement.value; // filter the shown groups by time created
    }

    try {
        const response = await fetch('/api/groups/advancedSearch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ searchTerm, showOnlyMine, timeFilter })
        });

        const data = await response.json(); // make the response as an object

        if (response.ok && data && data.success) { // success and data were given parameter by the controller response
            globalGroups = data.data; // save all the groups on the global parameter
            renderGroups(globalGroups);
        } else {
            showGroupError(searchInput, data.error || "Failed to execute search");
        }
    } catch (error) {
        console.error('Error fetching filtered groups:', error);
        showGroupError(searchInput, "Connection error. Please try again.");
    }
}

function renderGroups(groupsArray) {
    const listContainer = document.getElementById('groupsList');
    listContainer.innerHTML = ''; // reset the element

    groupsArray.forEach(group => {
        const usersArray = group.users || [];
        const isMember = usersArray.includes(CURRENT_USER_ID);
        const isAdmin = group.admin === CURRENT_USER_ID;

        const row = document.createElement('div'); // group div HTML
        row.id = `group-${group._id}`;
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
        usersBtn.onclick = () => openMembersPopup(group._id, isAdmin, usersArray, group.admin);

        btnGroup.appendChild(usersBtn);

        if (isAdmin) { // if is admin then create a 'delete group' and a 'rename' buttons if not then create a join/leave group button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
            editBtn.textContent = 'Edit Name';
            
            editBtn.onclick = () => { // add functionality to edit button
                nameSpan.classList.add('d-none');
                editBtn.classList.add('d-none');

                const editWrapper = document.createElement('div');
                editWrapper.className = 'flex-grow-1 me-3 d-flex flex-column';

                const editContainer = document.createElement('div'); // make the container to write the new name
                editContainer.className = 'd-flex align-items-center w-100';

                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.className = 'form-control form-control-sm w-75';
                editInput.value = group.name; // show group name at first while edit the group name
                editInput.setAttribute('maxlength', '60');

                const charCounter = document.createElement('span');
                charCounter.className = 'text-muted small ms-2 text-nowrap';
                charCounter.textContent = `${editInput.value.length}/60`;

                editInput.oninput = () => {
                    charCounter.textContent = `${editInput.value.length}/60`;
                    clearGroupError(editContainer);
                };

                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn btn-sm btn-success ms-2';
                saveBtn.textContent = 'Save';

                editContainer.appendChild(editInput);
                editContainer.appendChild(charCounter);
                editContainer.appendChild(saveBtn);
                
                editWrapper.appendChild(editContainer);
                row.insertBefore(editWrapper, btnGroup);

                saveBtn.onclick = () => { // add save button functionality
                    const newName = editInput.value.trim();
                    clearGroupError(editContainer);

                    if (newName === group.name) {
                        nameSpan.classList.remove('d-none');
                        editBtn.classList.remove('d-none');
                        editWrapper.remove();
                        return;
                    }
                    if (newName === '' || newName.length > 60) {
                        showGroupError(editContainer, "Group name must be between 1 and 60 characters");
                        return;
                    }

                    saveBtn.disabled = true;

                    fetch(`/api/groups/renameGroup/${group._id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ newName: newName })
                    })
                    .then(async response => {
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to update group name");
                        return data;
                    })
                    .then(data => {
                        nameSpan.textContent = newName;
                        group.name = newName;
                        nameSpan.classList.remove('d-none');
                        editBtn.classList.remove('d-none');
                        editWrapper.remove();
                    })
                    .catch(error => {
                        showGroupError(editContainer, error.message);
                        saveBtn.disabled = false;
                    });
                };
            };
            
            btnGroup.appendChild(editBtn);

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

        if (group._id === pendingHighlightGroupId) {
            scrollToAndHighlight(row);
            pendingHighlightGroupId = null;
        }
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
        if(data.success) openGroupsPopup(); // it will render all the groups from start
        // Refresh the feed posts to reflect changes in group membership
        fetchPostsFromServer();
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
        // Refresh the feed posts to reflect changes in group membership
        fetchPostsFromServer();
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
        // Refresh the feed posts to reflect changes in group membership
        fetchPostsFromServer();
    });
}

function openMembersPopup(groupId, isAdmin, usersArray, adminId) {
    currentOpenGroupId = groupId;
    const overlay = document.getElementById('membersOverlay');
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex'); // make the members popup visible
    
    const listContainer = document.getElementById('membersList');
    listContainer.innerHTML = ''; // reset the content

    usersArray.forEach(userId => {
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center mb-2';

        const userContainer = document.createElement('div');
        userContainer.className = 'd-flex align-items-center';

        const userImg = document.createElement('img');
        userImg.className = 'rounded-circle me-2';
        userImg.style.width = '35px';
        userImg.style.height = '35px';
        userImg.style.objectFit = 'cover';
        
        userImg.onerror = function() {
            this.onerror = null;
            this.src = '/images/profiles/Default_pfp.jpg';
        };

        const userSpan = document.createElement('span');
        
        fetch("/api/user/getBasicInfo", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
        })
        .then(response => response.json())
        .then(data => {
            userSpan.textContent = data.username || "Unknown"; 
            userImg.src = data.profilePic || '/images/profiles/Default_pfp.jpg';
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
            userSpan.textContent = "Error loading";
            userImg.src = '/images/profiles/Default_pfp.jpg';
        });
        
        userContainer.appendChild(userImg);
        userContainer.appendChild(userSpan);

        if (userId === adminId) {
            const adminBadge = document.createElement('span');
            adminBadge.className = 'badge bg-primary ms-2 rounded-pill';
            adminBadge.textContent = 'Admin';
            userContainer.appendChild(adminBadge);
        }

        row.appendChild(userContainer);

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
            // Refresh the feed posts to reflect changes in group membership
            fetchPostsFromServer();
        }
    });
}

function renameGroup(groupId, currentName) {
    const newName = prompt('Enter new group name:', currentName);
    
    if (!newName || newName.trim() === '' || newName.length > 60 || newName === currentName) { // check validiation of new name
        return; 
    }

    fetch(`/api/groups/renameGroup/${groupId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newName: newName.trim() })
    })
    .then(response => {
        if (response.ok) {
            openGroupsPopup()
        } else {
            alert('Failed to rename group');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function scrollToAndHighlight(groupElement) { // this function scrolldown and highlighting a new group who created
    setTimeout(() => {
        groupElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        groupElement.animate([
            { backgroundColor: 'transparent' },
            { backgroundColor: 'rgba(40, 167, 69, 0.4)' },
            { backgroundColor: 'transparent' }
        ], {
            duration: 1000,
            iterations: 2
        });
    }, 100);
}