let loadInboxOnPageLoad = true;

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  if (loadInboxOnPageLoad) {
    load_mailbox('inbox');
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = function(event) {
    event.preventDefault();
    let emails = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: emails,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      // Set the flag to false to prevent loading inbox on page load
      loadInboxOnPageLoad = false;

      // Load the sent mailbox after sending the email
      load_mailbox('sent');
    })
  };
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails in separate divs
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // ... do something else with emails ...
      emails.forEach((email) => {
        const element = document.createElement('table');
        element.setAttribute('class', 'mailbox-email');
        const emailStruct = document.createElement('tr');
        emailStruct.setAttribute('class', 'email-row');
        const emailRecipient = document.createElement('td');
        emailRecipient.setAttribute('class', 'email-recipient');
        const emailSubject = document.createElement('td');
        emailSubject.setAttribute('class', 'email-subject');
        const emailDate = document.createElement('td');
        emailDate.setAttribute('class', 'email-date');
        emailRecipient.innerHTML = email.recipients;
        emailSubject.innerHTML = email.subject;
        emailDate.innerHTML = email.timestamp;
        emailStruct.append(emailRecipient, emailSubject, emailDate);
        element.append(emailStruct);
        if (email.read == true) {
          element.style.background = '#f9f9f9';
        } else {
          element.style.background = 'white';
          element.style.fontWeight = 'bold';
        }
        document.querySelector('#emails-view').append(element)
        element.addEventListener('click', function() {
          load_email(email.id, mailbox);
        });
      });
  });
}

function load_email(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').innerHTML = '';
  

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const emailRecipient = document.createElement('div');
    emailRecipient.setAttribute('class', 'message-recipient');
    const emailSender = document.createElement('div');
    emailSender.setAttribute('class', 'message-sender');
    const emailSubject = document.createElement('div');
    emailSubject.setAttribute('class', 'message-subject');
    const emailDate = document.createElement('div');
    emailDate.setAttribute('class', 'message-date');
    const emailBody = document.createElement('div');
    emailBody.setAttribute('class', 'message-body');
    emailSubject.innerHTML = email.subject;
    emailSender.innerHTML = `<strong>From:</strong> ${email.sender}`;
    emailRecipient.innerHTML = `<strong>To:</strong> ${email.recipients}`;
    emailDate.innerHTML = `<strong>Date:</strong> ${email.timestamp}`;
    emailBody.innerHTML = `<pre>${email.body}</pre>`;
    emailSubject.style.cssText = 'font-weight: bold; font-size: 30px;';

    // Is the user the sender
    userEmail = document.querySelector('#user-email').value;
    if (mailbox.toLowerCase() === 'sent') {

      document.querySelector('#email-view').append(emailSubject, emailSender, emailRecipient, emailDate, emailBody);
    } else {
      const archiveButton = document.createElement('button');
      if (mailbox.toLowerCase() === 'inbox') {
        archiveButton.setAttribute('class', 'archive-button');
        archiveButton.innerHTML = 'Archive';
      } else if (mailbox.toLowerCase() === 'archive') {
        archiveButton.setAttribute('class', 'unarchive-button');
        archiveButton.innerHTML = 'Unarchive';
      }
      const replyButton = document.createElement('button');
      replyButton.setAttribute('class', 'reply-button');
      replyButton.innerHTML = 'Reply';
      document.querySelector('#email-view').append(emailSubject, emailSender, emailRecipient, emailDate, archiveButton, replyButton, emailBody);
      archiveButton.addEventListener('click', event => {
        archive_mail(id, email.archived, event);
      });
      replyButton.addEventListener('click', event => {
        email_reply(email);
      });
    } 
    
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    .catch(error => console.error('Error marking email as read:', error));
  })
  .catch(error => console.error('Error fetching email details:', error));
  } 

function archive_mail(id, isArchived, event) {
  const element = event.target
  element.parentElement.style.animationPlayState = 'paused';

  if (!element.parentElement) {
    return;
  }
  
  if (!isArchived && element.className === 'archive-button') {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    .then(() => {
        element.parentElement.style.animationPlayState = 'running';
        element.parentElement.addEventListener('animationend', () => {
          element.parentElement.style.animationPlayState = 'paused';
          load_mailbox('inbox');
        });
    })
    .catch(error => console.error('Error archiving email:', error));
  } else if (isArchived && element.className === 'unarchive-button') {
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    .then(() => {
        element.parentElement.style.animationPlayState = 'running';
        element.parentElement.addEventListener('animationend', () => {
          element.parentElement.style.animationPlayState = 'paused';
          load_mailbox('inbox');
        });
    })
    .catch(error => console.error('Error unarchiving email:', error));
  }
}

function email_reply(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  if (email.subject.includes('RE: ')) {
    document.querySelector('#compose-subject').value = email.subject;
  } else {
    document.querySelector('#compose-subject').value = 'RE: ' + email.subject; 
  }
  document.querySelector('#compose-body').value = `\n\n\n___________________\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`;

  document.querySelector('#compose-form').onsubmit = function() {
   let emails = document.querySelector('#compose-recipients').value
   let subject = document.querySelector('#compose-subject').value
   let body = document.querySelector('#compose-body').value
   
   fetch('/emails', {
     method: 'POST',
     body: JSON.stringify({
         recipients: emails,
         subject: subject,
         body: body
     })
   })
   .then(response => response.json())
   .then(result => {
      // Print result
      console.log(result);
    })
  }; 
}