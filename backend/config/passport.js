const passport=require("passport");
const GoogleStrategy=require("passport-google-oauth20").Strategy;
const pool=require("./db");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/auth/google/callback` : "http://localhost:5000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done)=>{
            try {
                const googleId=profile.id;
                const email=profile.emails[0].value;
                const name=profile.displayName;

                //email domain check

                const checkUser=await pool.query("SELECT * FROM users WHERE google_id=$1", [googleId]);
                if(checkUser.rows.length>0){
                    return done(null, checkUser.rows[0]);
                }

                const newUser=await pool.query(`INSERT INTO users (google_id, email, name, role, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [googleId, email, name, 'Faculty', 1]);

                return done(null, newUser.rows[0]);
            } catch (error) {
                return done(error, null);
            }
        }
    )
)


passport.serializeUser((user, done)=>{
    done(null, user.id);
})

passport.deserializeUser(async (id, done)=>{
    try {
        const res=await pool.query("SELECT * FROM users WHERE id=$1", [id]);
        done(null, res.rows[0])
    } catch (error) {
        done(error, null);
    }
})

module.exports=passport;