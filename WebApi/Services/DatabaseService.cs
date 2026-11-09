using WebApi.Repositories;

namespace WebApi.Services;

public class DatabaseService
{
    private readonly DatabaseRepository _databaseRepository;

    public DatabaseService(DatabaseRepository databaseRepository)
    {
        _databaseRepository = databaseRepository;
    }

    public Task<int> CheckConnectionAsync() => _databaseRepository.CheckConnectionAsync();
}
