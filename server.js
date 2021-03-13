const http = require('http');
const port = process.env.PORT || 8080;
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const app = new Koa();
const path = require('path');
const public = path.join(__dirname, 'public');
let lastTicketId = null;
let tickets = [];

app.use(koaStatic(public));

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
            const ticketsWithoutDesc = tickets.map(ticket => {
                const cloneTicket = {...ticket}
                delete cloneTicket.description
                
                return cloneTicket
            });

            ctx.response.body = ticketsWithoutDesc;
  
            return; 
        
        case 'ticketById':
            const {id} = ctx.request.query;
            const findTicket = tickets.find(ticket => ticket.id == id);
            if(findTicket)  ctx.response.body = findTicket;
               
            return; 
            
        case 'createTicket':
            if(!lastTicketId) {
                ctx.request.body.id = 1;
                lastTicketId = 1;
            } else {
                lastTicketId += 1;
                ctx.request.body.id = lastTicketId;
            }
            
            tickets.push(ctx.request.body);
            ctx.response.body = 'ok';

            return;              
        
        default:
            ctx.response.body = 'сервер работает';
            return;
    }
});

http.createServer(app.callback()).listen(port);