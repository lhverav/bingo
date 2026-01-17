import mongose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;

const UserSchema= new mongose.Schema({
    email:{type:String, required:true, unique:true, lowercase:true},
    password:{type:String, required:true},
    name:{type:String, required:true},
    role:{type:String, enum:["host", "admin"], default:"host"},
},{
    timestamps:true,
});

 async function seed() {
    await mongose.connect(MONGODB_URI);
    
    const User = mongose.models.User || mongose.model("User", UserSchema);

    const users = [
      {
        email: "host@bingo.com",
        password: await bcrypt.hash("123456", 12),
        name: "Host Principal",
        role: "host",
      },
      {
        email: "admin@bingo.com",
        password: await bcrypt.hash("admin123", 12),
        name: "Administrador",
        role: "admin",
      },
    ];

    for (const userData of users) {
      await User.findOneAndUpdate(
        { email: userData.email },
        userData,
        { upsert: true, new: true }
      );
      console.log(`User ${userData.email} created/updated`);
    }

    await mongose.disconnect();
    console.log("Seed completed!");
  }

  seed().catch(console.error);
