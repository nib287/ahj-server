const http = require('http');
const port = process.env.PORT || 8080;
const fs = require('fs')
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const path = require('path');
let lastTicketId = null;

app.use(koaBody({
    urlencoded: true,
    multipart: true
}));

app.use(async(ctx, next) => {
    ctx.response.set({'Access-Control-Allow-Origin':'*'});
    return await next();
});

app.use(async(ctx) => {
    let {method} = ctx.request.query;
    method ? method : method = ctx.request.body.method;
    

    switch (method) {
        case 'allTickets':
            const allTicketsResponse = new Promise((resolve, reject) => {
                fs.readFile(path.join(__dirname,'public', 'ticket.json'), (err, data) => {
                    if (err) {
                        reject(err);
                      return
                    }
                    
                    resolve(data); 
                }); 
            });

            return allTicketsResponse.then(
                (result) => ctx.response.body = result,
                (err) => console.error('ошибка чтения ticket.json', err)
            );
        
        case 'fullDescTicket':
            const {id} = ctx.request.query;
            const fullDescResponse = new Promise((resolve, reject) => {
                fs.readFile(path.join(__dirname,'public', 'ticket.json'), (err, data) => {
                    if (err) {
                        reject(err);
                      return
                    }
                    
                    data = JSON.parse(data)
                    const fullDescTicketID = data.findIndex(ticket => ticket.id == id);
                    const fullDesc = data[fullDescTicketID].full;
                    data = JSON.stringify(fullDesc);  
                 
                    resolve(data); 
                }); 
            });

            return fullDescResponse.then(
                (result) => ctx.response.body = result,
                (err) => console.error('ошибка чтения ticket.json', err)
            );
          
        case 'createTicket':
            if(!lastTicketId) {
                ctx.request.body.id = 1;
                lastTicketId = 1;
            } else {
                lastTicketId += 1;
                ctx.request.body.id = lastTicketId;
            }
         
            fs.readFile(path.join(__dirname,'public', 'ticket.json'), (err, data) => {
                if (err) {
                  console.error(err)
                  return
                }

                if(data.length) {
                    data = JSON.parse(data)
                    data.push(ctx.request.body)
                    data = JSON.stringify(data);
                } else {
                    data = JSON.stringify([ctx.request.body]);
                }

                fs.writeFile(path.join(__dirname, 'public', 'ticket.json'), data, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            });
           
            ctx.response.body = lastTicketId;

            return;
            
        case 'deleteTicket':
            fs.readFile(path.join(__dirname,'public', 'ticket.json'), (err, data) => {
                if (err) {
                  console.error(err)
                  return
                }

                data = JSON.parse(data)
                const deleteTicketID = data.findIndex(ticket => ticket.id == ctx.request.body.id);
                data.splice(deleteTicketID, 1);
                data = JSON.stringify(data);                   
               
                fs.writeFile(path.join(__dirname, 'public', 'ticket.json'), data, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            });
            
            ctx.response.body = 'ticket deleted';

            return;

        case 'editTicket':
            fs.readFile(path.join(__dirname,'public', 'ticket.json'), (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }

                data = JSON.parse(data)
                const editTicketID = data.findIndex(ticket => ticket.id == ctx.request.body.id);
                const editedTicket = {...data[editTicketID], ...ctx.request.body}
                data.splice(editTicketID, 1, editedTicket);
                data = JSON.stringify(data);                   
                
                fs.writeFile(path.join(__dirname, 'public', 'ticket.json'), data, (err) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            });
            
            ctx.response.body = 'ticket edit';

            return;                             
        
        default:
            ctx.response.body = 'сервер работает';
            
            return;
    }
});

http.createServer(app.callback()).listen(port);

