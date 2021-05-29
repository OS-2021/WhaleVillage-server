import jwt from 'jsonwebtoken';

export const jwtsign = (async (id, time) => {
  const token = jwt.sign({id: id}, process.env.jwtsecret, {expiresIn: time});
  return token;
});

export const jwtverify = (async (token) => {
  let check;
  await jwt.verify(token, process.env.jwtsecret, async (error, decoded) => {
    if(error){ 
      decoded = await jwt.decode(token);
      check = [false, decoded['id']]; 
      }
    else{ check = [true, decoded['id']]; }
  });

  return check;
});