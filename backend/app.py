from flask import request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from resources.models import Usuario, Movimentacao, ContaPagar
from resources.config import app, db
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash
import traceback
import time
import sqlalchemy.exc

# Tentativa de conexão com o banco
for i in range(10):
    try:
        with app.app_context():
            db.create_all()
        print("✅ Banco conectado com sucesso!")
        break
    except sqlalchemy.exc.OperationalError as e:
        print(f"❌ Tentativa {i+1}/10 falhou: {e}")
        time.sleep(3)
else:
    print("❌ Não foi possível conectar ao banco de dados após várias tentativas.")
    exit(1)

# Configuração do Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'gestaofintcc@gmail.com'
app.config['MAIL_PASSWORD'] = 'fmvq yhmj cjhb ajsu'
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']

mail = Mail(app)
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])

api = Api(app)
CORS(app)

class Home(Resource):
    def get(self):
        return jsonify({"message": "Servidor Flask está rodando!"})

class Registro(Resource):
    def post(self):
        data = request.get_json()
        if Usuario.query.filter_by(email=data['email']).first():
            return {'mensagem': 'Usuário já existe'}, 400

        novo_usuario = Usuario(
            username=data['username'],
            email=data['email'],
            senha=data['senha']
        )
        db.session.add(novo_usuario)
        db.session.commit()
        return {'mensagem': 'Usuário registrado com sucesso', 'id': novo_usuario.id}, 201

class Login(Resource):
    def post(self):
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data['email']).first()
        if usuario and usuario.verificar_senha(data['senha']):
            return {
                'mensagem': 'Login bem-sucedido',
                'usuario': {
                    'id': usuario.id,
                    'username': usuario.username
                }
            }

        return {'mensagem': 'Credenciais inválidas'}, 401

class MovimentacoesFinanceiras(Resource):
    def get(self, usuario_id):
        movimentacoes = Movimentacao.query.filter_by(usuario_id=usuario_id).all()
        return jsonify([
            {
                "id": mov.id,
                "tipo": mov.tipo,
                "valor": float(mov.valor),
                "data": mov.data_movimentacao.strftime("%Y-%m-%d %H:%M:%S")
            }
            for mov in movimentacoes
        ])

class ListarUsuarios(Resource):
    def get(self):
        usuarios = Usuario.query.all()
        return jsonify([
            {"id": u.id, "username": u.username, "email": u.email} 
            for u in usuarios
        ])

@app.route('/perfil/<int:user_id>', methods=['GET'])
def perfil_usuario(user_id):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    return jsonify({
        'id': usuario.id,
        'username': usuario.username,
        'email': usuario.email,
        'nomeCompleto': usuario.nomeCompleto,
        'dataNascimento': usuario.dataNascimento,
        'genero': usuario.genero,
        'cpf': usuario.cpf,
        'telefone': usuario.telefone,
        'endereco': usuario.endereco,
        'cidade': usuario.cidade,
        'estado': usuario.estado,
        'cep': usuario.cep,
        'rendaMensal': usuario.rendaMensal,
        'objetivo': usuario.objetivo
    })

@app.route('/perfil/<int:user_id>', methods=['PUT'])
def atualizar_perfil(user_id):
    data = request.get_json()
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario.username = data.get('username', usuario.username)
    usuario.email = data.get('email', usuario.email)
    usuario.nomeCompleto = data.get('nomeCompleto', usuario.nomeCompleto)
    usuario.dataNascimento = data.get('dataNascimento', usuario.dataNascimento)
    usuario.genero = data.get('genero', usuario.genero)
    usuario.cpf = data.get('cpf', usuario.cpf)
    usuario.telefone = data.get('telefone', usuario.telefone)
    usuario.endereco = data.get('endereco', usuario.endereco)
    usuario.cidade = data.get('cidade', usuario.cidade)
    usuario.estado = data.get('estado', usuario.estado)
    usuario.cep = data.get('cep', usuario.cep)
    usuario.rendaMensal = data.get('rendaMensal', usuario.rendaMensal)
    usuario.objetivo = data.get('objetivo', usuario.objetivo)

    db.session.commit()

    return jsonify({'mensagem': 'Perfil atualizado com sucesso'})


class RequestPasswordReset(Resource):
    def post(self):
        try:
            data = request.get_json()
            email = data.get('email')

            print(f"🔍 Recebendo solicitação para: {email}")

            usuario = Usuario.query.filter_by(email=email).first()
            if not usuario:
                print("❌ Usuário não encontrado!")
                return jsonify({'mensagem': 'Usuário não encontrado'}), 404

            token = s.dumps(email, salt='reset-password')
            reset_url = f"http://localhost:4200/reset-password/{token}"
            print(f"🔑 Token gerado: {token}")

            msg = Message(
                subject='Redefinição de Senha',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email]
            )
            msg.body = f'Clique no link para redefinir sua senha: {reset_url}'

            print("📨 Tentando enviar e-mail...")
            mail.send(msg)
            print("E-mail enviado com sucesso!")

            return jsonify({
                'mensagem': 'E-mail de redefinição enviado com sucesso!',
                'status': 'success',
                'email': email
            })

        except Exception as e:
            print("🔥 Erro ao processar a solicitação:")
            traceback.print_exc()
            return jsonify({
                'mensagem': 'Erro no servidor ao enviar e-mail',
                'erro': str(e),
                'status': 'error'
            }), 500

class ResetPassword(Resource):
    def post(self, token):
        try:
            email = s.loads(token, salt='reset-password', max_age=3600)
        except Exception as e:
            print("❌ Erro ao validar token:", e)
            return jsonify({'mensagem': 'Token inválido ou expirado'}), 400

        data = request.get_json()
        nova_senha = data.get('password')

        usuario = Usuario.query.filter_by(email=email).first()
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        usuario.senha = generate_password_hash(nova_senha)
        db.session.commit()

        return jsonify({'mensagem': 'Senha redefinida com sucesso!'}), 200


@app.route('/conta', methods=['POST'])
def adicionar_conta():
    data = request.get_json()
    conta = ContaPagar(
        usuario_id=data['usuario_id'],
        descricao=data['descricao'],
        valor=data['valor'],
        data=data['data']
    )
    db.session.add(conta)
    db.session.commit()
    return jsonify({'mensagem': 'Conta adicionada com sucesso!'})

@app.route('/contas/<int:usuario_id>', methods=['GET'])
def listar_contas(usuario_id):
    contas = ContaPagar.query.filter_by(usuario_id=usuario_id).all()
    return jsonify([
        {"descricao": c.descricao, "valor": float(c.valor)}
        for c in contas
    ])



@app.route('/receber', methods=['POST'])
def adicionar_conta_receber():
    data = request.get_json()
    conta = ContaReceber(
        usuario_id=data['usuario_id'],
        descricao=data['descricao'],
        valor=data['valor'],
        data=data['data']
    )
    db.session.add(conta)
    db.session.commit()
    return jsonify({'mensagem': 'Entrada registrada com sucesso!'})

@app.route('/receber/<int:usuario_id>', methods=['GET'])
def listar_contas_receber(usuario_id):
    contas = ContaReceber.query.filter_by(usuario_id=usuario_id).all()
    return jsonify([
        {"descricao": c.descricao, "valor": float(c.valor), "data": c.data.strftime('%Y-%m-%d')}
        for c in contas
    ])




# Rotas RESTful
api.add_resource(Home, '/')
api.add_resource(Registro, '/registrar')
api.add_resource(Login, '/login')
api.add_resource(MovimentacoesFinanceiras, '/movimentacoes/<int:usuario_id>')
api.add_resource(ListarUsuarios, '/listar')
api.add_resource(RequestPasswordReset, '/request-password-reset')
api.add_resource(ResetPassword, '/reset-password/<token>')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
